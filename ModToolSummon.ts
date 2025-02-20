import {
  CodeBlockEvents,
  Component,
  Entity,
  Player,
  PropTypes,
  Vec3,
  World,
  Quaternion,
  LocalEvent,
  Color
} from 'horizon/core';
import {moderatorRoleValue, CoreKey, resetEvent} from "./ModTool";

const SENSITIVITY = 40



class ModToolSummon extends Component<typeof ModToolSummon> {
  static propsDefinition = {ModTool: {type: PropTypes.Entity}};
  private modToolOwner:Player|null = null;
  private modToolGrabTime:number = 0;
  private ModTool:Entity|null = null;
  private trackedPlayers:Player[] = [];

  FaceTowardsPlayer(player: Player, item:Entity){
    const forward = player.head.position.get().sub(item.position.get()).normalize();
    const up = Vec3.up;
    item.rotation.set(Quaternion.lookRotation(forward, up));
  }
  StayInFrontOfPlayer(player:Player, item:Entity){
      const playerPosition = player.head.position.get()
      const forward = player.forward.get()
      const dirToPlayer = playerPosition.sub(item.position.get())
      if (dirToPlayer.magnitude() > 5) {
        item.position.set(playerPosition.add(forward.mul(1)))
      }

  }

  CheckHands(){
    if (this.trackedPlayers.length > 0){
      this.trackedPlayers.forEach((player:Player)=>{
        const playerRightHandPosition = player.rightHand.position.get();
        const playerLeftSideHeadPosition = player.head.position.get().add(new Vec3(-0.1, 0, 0));
        const distanceSquared = playerRightHandPosition.distanceSquared(playerLeftSideHeadPosition);
        if (distanceSquared <= SENSITIVITY / 1000){
          if (this.modToolOwner?.id === player.id){
            this.UnassignModTool();
          }else{
            this.AssignModTool(player);
          }
        }


      })
    }
  }
  UpdateTrackedPlayers(){
    this.trackedPlayers.splice(0, this.trackedPlayers.length);
    this.world.getPlayers().forEach((player:Player)=>{
      this.TrackPlayer(player);
    });
  }
  ResetModTool(player:Player){
    this.sendLocalBroadcastEvent(resetEvent, {message: player});


  }
  AssignModTool(player:Player){
    if (this.modToolOwner === null || this.modToolOwner.id === this.world.getServerPlayer().id){
      this.modToolOwner = player;
      this.modToolGrabTime = Date.now() / 1000;
      this.ResetModTool(player);
    }else {
      //someone else has the mod tool
      const requestTime = Date.now() / 1000;
      const timeSinceGrab = requestTime - this.modToolGrabTime;
      if (timeSinceGrab < 60){
        this.world.ui.showPopupForPlayer(player,this.modToolOwner.name.get() + ' currently has the mod tool. Please wait ' + (60 - timeSinceGrab) + ' more seconds.', 3, {showTimer: false, fontSize: 2, backgroundColor: Color.black, fontColor: Color.white});
      }else{
        // they have had it more than 60 seconds
        this.modToolOwner = player;
        this.modToolGrabTime = Date.now() / 1000;
        this.ResetModTool(player);

      }
    }



  }
  UnassignModTool(){
    this.modToolOwner = this.world.getServerPlayer();
    this.ResetModTool(this.world.getServerPlayer());
    this.ModTool?.position.set(new Vec3(0, 4000, 0));
    this.UpdateTrackedPlayers();

  }
  TrackPlayer(player:Player){
    const playerRole = this.world.persistentStorage.getPlayerVariable(player, CoreKey('Role'));
    if (playerRole >= moderatorRoleValue){
      if (!(this.trackedPlayers.includes(player))){
        this.trackedPlayers.push(player);
      }
    }
  }
  RemoveTrackedPlayer(player:Player){
    if (this.trackedPlayers.includes(player)){
      this.trackedPlayers.splice(this.trackedPlayers.indexOf(player), 1);
    }
  }



  start() {
    if (this.props.ModTool){
      this.ModTool = this.props.ModTool.as(Entity);
    }
    this.modToolOwner = this.world.getServerPlayer();
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerEnterWorld, (player:Player)=>{this.TrackPlayer(player)});
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerExitWorld, (player:Player)=>{
      this.RemoveTrackedPlayer(player);
      if (this.modToolOwner?.id === player.id){
        this.UnassignModTool();
      }
    });
    this.async.setInterval(()=>{this.CheckHands()}, 5000);
    this.UnassignModTool()
    this.startUpdate();
  }
  startUpdate(){
    this.connectLocalBroadcastEvent(World.onUpdate, ({deltaTime})=>{
      if (this.modToolOwner !== null && this.ModTool){
        if (this.modToolOwner.id !== this.world.getServerPlayer().id) {
          this.FaceTowardsPlayer(this.modToolOwner, <Entity>this.ModTool);
          this.StayInFrontOfPlayer(this.modToolOwner, <Entity>this.ModTool)
        }
      }
    })
  }


}
Component.register(ModToolSummon);