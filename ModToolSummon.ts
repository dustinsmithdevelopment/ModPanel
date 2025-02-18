import {Component, Entity, Player, PropTypes} from 'horizon/core';

const minModValue = 10;

class ModToolSummon extends Component<typeof ModToolSummon> {
  static propsDefinition = {ModTool: {type: PropTypes.Entity}};
  private ModTool:Entity|null = null;
  private trackedPlayers:Player[] = [];

  CheckHands(){

  }
  TrackPlayer(player:Player){
    if (this.trackedPlayers.indexOf(player) === -1){
      this.trackedPlayers.push(player);
    }
  }



  start() {
    if (this.props.ModTool){
      this.ModTool = this.props.ModTool.as(Entity);
    }
  }


}
Component.register(ModToolSummon);