import {CodeBlockEvents, Component, Player} from "horizon/core";
const VISIT_VARIABLE = 'ModPanel_Core:VisitCount'
const TIME_VARIABLE = 'ModPanel_Core:TimeInWorld'
const secondInMs = 1000;
const minuteInMs = secondInMs * 60;

class PlayerTracking extends Component<typeof PlayerTracking> {
  private trackedPlayers: Player[] = [];

  async AddTime(){
    const persistentValues = this.world.persistentStorage;
    this.trackedPlayers.forEach((player:Player)=>{
      const currentTime = persistentValues.getPlayerVariable(player, TIME_VARIABLE) || 0;
      persistentValues.setPlayerVariable(player, TIME_VARIABLE, currentTime + 5);
    })
  }
  AddVisit(player:Player){
    const currentVisitCount = this.world.persistentStorage.getPlayerVariable(player, VISIT_VARIABLE) || 0;
    this.world.persistentStorage.setPlayerVariable(player, VISIT_VARIABLE, currentVisitCount + 1);
  }

  PlayerEnter(player:Player){
    this.AddVisit(player);
    if(!(this.trackedPlayers.includes(player))){
      this.trackedPlayers.push(player);
    }
  }
  PlayerExit(player:Player){
    if(this.trackedPlayers.includes(player)){
      this.trackedPlayers.splice(this.trackedPlayers.indexOf(player), 1);
    }
  }
  PlayerAFK(player:Player){
    if(this.trackedPlayers.includes(player)){
      this.trackedPlayers.splice(this.trackedPlayers.indexOf(player), 1);
    }
  }
  PlayerBack(player:Player){
    if(!(this.trackedPlayers.includes(player))){
      this.trackedPlayers.push(player);
    }
  }

  start() {
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerEnterWorld, (player:Player)=>{this.PlayerEnter(player)});
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerExitWorld, (player:Player)=>{this.PlayerExit(player)});
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerEnterAFK, (player:Player)=>{this.PlayerAFK(player)});
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerExitAFK, (player:Player)=>{this.PlayerBack(player)});


    this.trackedPlayers = this.world.getPlayers();

    this.async.setInterval(()=>{this.AddTime()}, 5 * minuteInMs);

  }
}
Component.register(PlayerTracking);