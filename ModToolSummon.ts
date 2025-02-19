import {CodeBlockEvents, Component, Entity, Player, PropTypes, Vec3, World, Quaternion} from 'horizon/core';
import {moderatorRoleValue, CoreKey} from "./ModTool";





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
        if (distanceSquared <= 0.02){
          if (this.modToolOwner === null || this.modToolOwner.id === this.world.getServerPlayer().id){
            this.AssignModTool(player);
          }else if (this.modToolOwner.id === player.id){
            this.UnassignModTool();
          }
        }


      })
    }
  }
  AssignModTool(player:Player){
    this.modToolOwner = player;
  }
  UnassignModTool(){
    this.modToolOwner = this.world.getServerPlayer();
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
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerExitWorld, (player:Player)=>{this.RemoveTrackedPlayer(player)});
    this.async.setInterval(()=>{this.CheckHands()}, 5000);
    this.startUpdate();
  }
  startUpdate(){
    this.connectLocalBroadcastEvent(World.onUpdate, ({deltaTime})=>{
      if (this.modToolOwner !== null && this.props.ModTool){
        if (this.modToolOwner.id !== this.world.getServerPlayer().id) {
          this.FaceTowardsPlayer(this.modToolOwner, <Entity>this.ModTool);
          this.StayInFrontOfPlayer(this.modToolOwner, <Entity>this.ModTool)
        }
      }
    })
  }


}
Component.register(ModToolSummon);