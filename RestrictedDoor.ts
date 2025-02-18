import { RESTRICTED_TELEPORT_LOCATIONS, CoreKey, managerRoleValue } from './ModTool'
import {PropTypes, Component, Player, CodeBlockEvents, SpawnPointGizmo} from "horizon/core";


class RestrictedDoor extends Component<typeof RestrictedDoor> {
  static propsDefinition = {
    locationName: {type:PropTypes.String},
    locationSpawn: {type:PropTypes.Entity}
  };
  private location: string|null = null;
  CheckPlayerAccess(player:Player):boolean{
    const playerLevel = this.world.persistentStorage.getPlayerVariable(player, CoreKey('Role'));
    const playerIsManager = playerLevel >= managerRoleValue
    const playerAccess = this.world.persistentStorage.getPlayerVariable(player, CoreKey('Rooms')).toString();
    const playerHasAccess = playerAccess[RESTRICTED_TELEPORT_LOCATIONS.indexOf(<string>this.location)] == '9';

    return playerIsManager || playerHasAccess;
  }
  TeleportPlayer(player:Player){
    // @ts-ignore: Object is recognized as type 'Never' and does not allow compilation but syntax is valid
    this.props.locationSpawn.as(SpawnPointGizmo).teleportPlayer(player);
  }

  start() {
    this.location = this.props.locationName;
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerEnterTrigger, (player:Player)=>{
      // make sure location has been defined
      if (this.location){
        if (this.CheckPlayerAccess(player)) {
          this.TeleportPlayer(player);
        }
      }
    })
  }
}
Component.register(RestrictedDoor);