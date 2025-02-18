import {CodeBlockEvents, Component, Entity, Player, PropTypes, Vec3} from 'horizon/core';
import {moderatorRoleValue, CoreKey} from "./ModTool";





class ModToolSummon extends Component<typeof ModToolSummon> {
  static propsDefinition = {ModTool: {type: PropTypes.Entity}};
  private ModTool:Entity|null = null;
  private trackedPlayers:Player[] = [];

  CheckHands(){
    if (this.trackedPlayers.length > 0){
      this.trackedPlayers.forEach((player:Player)=>{
        const playerRightHandPosition = player.rightHand.position.get();
        const playerLeftSideHeadPosition = player.head.position.get().add(new Vec3(-0.1, 0, 0));
        const distanceSquared = playerRightHandPosition.distanceSquared(playerLeftSideHeadPosition);
        if (distanceSquared <= 0.02){
          console.log(player.name + " is holding the mod tool");
        }


      })
    }
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
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerEnterWorld, (player:Player)=>{this.TrackPlayer(player)});
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerExitWorld, (player:Player)=>{this.RemoveTrackedPlayer(player)});
    this.async.setInterval(()=>{this.CheckHands()}, 5000);
  }


}
Component.register(ModToolSummon);