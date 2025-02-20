import {CodeBlockEvents, Color, Component, Player} from 'horizon/core';
import {CoreKey, WORLD_OWNER, ownerRoleValue} from './ModTool'

class TakeModToolOwnership extends Component<typeof TakeModToolOwnership> {
  static propsDefinition = {};

  start() {
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerEnterTrigger,(player:Player)=>{
      if (player.name.get() == WORLD_OWNER){
        this.world.persistentStorage.setPlayerVariable(player, CoreKey('Role'), ownerRoleValue);
        this.world.ui.showPopupForPlayer(player,
          'You are now the world owner. You can now manage the world.', 3, {backgroundColor: Color.black, fontColor: Color.white, fontSize: 2, showTimer: false})
      }
    })
  }
}
Component.register(TakeModToolOwnership);