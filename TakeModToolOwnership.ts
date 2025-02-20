import {CodeBlockEvents, Component, Player} from 'horizon/core';
import {CoreKey, WORLD_OWNER, ownerRoleValue} from './ModTool'

class TakeModToolOwnership extends Component<typeof TakeModToolOwnership> {
  static propsDefinition = {};

  start() {
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerEnterTrigger,(player:Player)=>{
      if (player.name.get() == WORLD_OWNER){
        this.world.persistentStorage.setPlayerVariable(player, CoreKey('Role'), ownerRoleValue);
      }
    })
  }
}
Component.register(TakeModToolOwnership);