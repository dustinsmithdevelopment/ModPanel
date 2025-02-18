import { RESTRICTED_TELEPORT_LOCATIONS, CoreKey, managerRoleValue } from './ModTool'
import {PropTypes, Component, Player, CodeBlockEvents, SpawnPointGizmo, IPersistentStorage} from "horizon/core";
function CheckPlayerAccess(player:Player, location:string, persistentStorage:IPersistentStorage):boolean{
  const playerLevel = persistentStorage.getPlayerVariable(player, CoreKey('Role'));
  const playerIsManager = playerLevel >= managerRoleValue
  const playerAccess = persistentStorage.getPlayerVariable(player, CoreKey('Rooms')).toString();
  const playerHasAccess = playerAccess[RESTRICTED_TELEPORT_LOCATIONS.indexOf(location)] == '9';

  return playerIsManager || playerHasAccess;
}

class RestrictedDoor extends Component<typeof RestrictedDoor> {
  static propsDefinition = {
    locationName: {type:PropTypes.String},
    locationSpawn: {type:PropTypes.Entity}
  };
  private location: string|null = null;
  TeleportPlayer(player:Player){
    // @ts-ignore: Object is recognized as type 'Never' and does not allow compilation but syntax is valid
    this.props.locationSpawn.as(SpawnPointGizmo).teleportPlayer(player);
  }

  start() {
    this.location = this.props.locationName;
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerEnterTrigger, (player:Player)=>{
      // make sure location has been defined
      if (this.location){
        if (CheckPlayerAccess(player, this.location, this.world.persistentStorage)) {
          this.TeleportPlayer(player);
        }
      }
    })
  }
}
Component.register(RestrictedDoor);
class KickOutArea extends Component<typeof KickOutArea> {
  static propsDefinition = {
    locationName: {type:PropTypes.String},
    kickSpawn: {type:PropTypes.Entity}
  };
  private location: string|null = null;
  TeleportPlayer(player:Player){
    // @ts-ignore: Object is recognized as type 'Never' and does not allow compilation but syntax is valid
    this.props.kickSpawn.as(SpawnPointGizmo).teleportPlayer(player);
  }

  start() {
    this.location = this.props.locationName;
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerEnterTrigger, (player:Player)=>{
      // make sure location has been defined
      if (this.location){
        if (!(CheckPlayerAccess(player, this.location, this.world.persistentStorage))) {
          this.TeleportPlayer(player);
        }
      }
    })
  }
}
Component.register(KickOutArea);