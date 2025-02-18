// Created by TechGryphon

// Attach this to a CustomUI Gizmo

// Variables required
// Group Name: ModPanel_Core
// Variables as numbers: Role, Rooms, Permissions, BanStatus, BanTime, KickCount, VisitCount, TimeInWorld

// Enter your name below
const WORLD_OWNER = 'TechGryphon';
const VERSION = 'v1.0';
const PREFERRED_FONT_SIZE = 36;
const DEFAULT_PLAYER_SPEED = 4.50;
const ROLES: { [key: string]: RoleData } = {
  '100': { name: 'Owner', color: 'blue' },
  '50': { name: 'Manager', color: 'green' },
  '10': { name: 'Moderator', color: 'green' },
  '0': { name: 'Player', color: 'white' },
};
const TELEPORT_LOCATIONS = [
  'Respawn', 'VIP', 'Jail', 'Office', 'Stage', 'Bar', 'Room1', 'Room2'
];
export const RESTRICTED_TELEPORT_LOCATIONS = [...TELEPORT_LOCATIONS].filter(location => location !== 'Respawn' && location !== 'Jail');


const calculatedPanelHeight = PREFERRED_FONT_SIZE * 40;
interface RoleData {
  name: string;
  color: string;
}

interface RoleValue {
  name: string;
  roleLevelValue: number;
}

function getRoles(roles: { [key: string]: RoleData }): RoleValue[] {
  return Object.entries(roles)
      .sort(([aKey], [bKey]) => Number(bKey) - Number(aKey))
      .map(([key, role]) => ({
        name: role.name,
        roleLevelValue: Number(key),
      }));
}



const roleValues = getRoles(ROLES);
// @ts-ignore: Value is defined in above function but compiler is unable to see it when type checking
const managerRoleValue:number = roleValues.find(role => role.name === 'Manager').roleLevelValue;
// @ts-ignore: Value is defined in above function but compiler is unable to see it when type checking
const moderatorRoleValue:number = roleValues.find(role => role.name === 'Moderator').roleLevelValue;


///////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////


import {UIComponent, View, Text, UINode, Binding, Callback, Pressable, DynamicList, PressableProps} from 'horizon/ui';
import {
  Component,
  CodeBlockEvents,
  Player,
  World,
  PropTypes,
  SpawnPointGizmo,
  VoipSettingValues,
  Color, Vec3
} from "horizon/core";

interface MenuItem {
  label: string;
  onClick: (modPlayer:Player, targetPlayer:Player) => void;
  color: string;
}

function CoreKey(variableName: string) {
  return 'ModPanel_Core' + ':' + variableName;
}


class ModTool extends UIComponent {
  static propsDefinition = {
    Respawn: { type: PropTypes.Entity},
    VIP: { type: PropTypes.Entity},
    Jail: { type: PropTypes.Entity},
    Office: { type: PropTypes.Entity},
    Stage: { type: PropTypes.Entity},
    Bar: { type: PropTypes.Entity},
    Room1: { type: PropTypes.Entity},
    Room2: { type: PropTypes.Entity},
  };

  private currentPage = 'PlayerList'
  private playerList: Player[] = new Array<Player>();
  private header1 = Text({text: 'Mod Panel ' + VERSION, style: {fontSize:PREFERRED_FONT_SIZE, color: 'yellow', textAlign: 'center'}})
  private header2 = Text({text: 'Created by TechGryphon', style: {fontSize:PREFERRED_FONT_SIZE, color: 'yellow', textAlign: 'center'}})
  private displayGap = Text({text: ' ', style: {fontSize:PREFERRED_FONT_SIZE, color: 'yellow', textAlign: 'center'}})
  private targetPlayerNameText = new Binding<String>(' ');
  private playerNameDisplay = Text({text: this.targetPlayerNameText, style: {fontSize:PREFERRED_FONT_SIZE, color: 'green', textAlign: 'center'}})
  private errorText = new Binding<String>(' ');
  private errorDisplay = Text({text: this.errorText, style: {fontSize:PREFERRED_FONT_SIZE, color: 'red', textAlign: 'center'}})
  private resetButton = Pressable({
    children: Text({text: 'Reset World', style: {color: 'red', fontSize: PREFERRED_FONT_SIZE, textAlign: 'center'}}),
    onClick: (player:Player) => {
      const modLevel:number = this.world.persistentStorage.getPlayerVariable(player, CoreKey('Role'));
      if (modLevel >= moderatorRoleValue) this.DisplayWorldReset(); else this.errorText.set('You do not have permission to reset the world.');
    }
  });
  DisplayWorldReset(){
    this.targetPlayerNameText.set(' ');
    let tempList: UINode[] = [];
    tempList.push(Pressable({
      children: Text({text: 'Reset World', style: {color: 'red', fontSize: PREFERRED_FONT_SIZE, textAlign: 'center'}}),
      onClick: (player:Player) => {this.world.reset()}
    }));
    tempList.push(this.displayGap);
    tempList.push(Pressable({
      children: Text({text: 'Cancel Reset', style: {color: 'green', fontSize: PREFERRED_FONT_SIZE, textAlign: 'center'}}),
      onClick: (player:Player) => {this.ShowPlayerList()}
    }));
    this.displayListBinding.set(tempList);
  }
  private noPlayersText = [Text({text: 'No Players', style: {fontSize:PREFERRED_FONT_SIZE, color: 'yellow', textAlign: 'center'}})]
  displayListBinding = new Binding<UINode[]>([]);

  private controlledMenuPages:String[] = ['Teleport Options', 'Voice Settings', 'Kick Options', 'Player Movement', 'World Settings']
  private mainMenuPages: MenuItem[] = [
      {label: 'Back', onClick: (modPlayer:Player, targetPlayer:Player)=>{
        this.ShowPlayerList();
        }, color: 'white'},
      {label: 'Player Management', onClick: (modPlayer:Player, targetPlayer:Player) => {
              this.currentPage = 'PlayerManagement';
              this.errorText.set(' ');
              this.BuildMenu(modPlayer, targetPlayer, this.playerManagementMenuPages);
        }, color: 'purple'},
      {label: 'Teleport Options', onClick: (modPlayer:Player, targetPlayer:Player) => {
        this.ShowTeleportOptionsMenuOptions(modPlayer, targetPlayer);
        }, color: 'green'},
      {label: 'Voice Settings', onClick: (modPlayer:Player, targetPlayer:Player) => {
              this.currentPage = 'Voice Settings';
              this.BuildMenu(modPlayer, targetPlayer, this.VoiceSettingsMenuPages);
        }, color: 'yellow'},
      {label: 'Kick Options', onClick: (modPlayer:Player, targetPlayer:Player) => {
              this.currentPage = 'Kick Options';
              this.BuildMenu(modPlayer, targetPlayer, this.kickOptionsMenuPages);
        }, color: 'orange'},
      {label: 'Player Movement', onClick: (modPlayer:Player, targetPlayer:Player) => {
              this.currentPage = 'Player Movement';
              this.BuildMenu(modPlayer, targetPlayer, this.playerMovementMenuPages);
        }, color: 'teal'},
      {label: 'World Settings', onClick: (modPlayer:Player, targetPlayer:Player) => {
        this.currentPage = 'World Settings';
        this.BuildMenu(modPlayer, targetPlayer, this.worldSettingsMenuPages);
        }, color: 'blue'},
      {label: 'Stats', onClick: (modPlayer:Player, targetPlayer:Player) => {
        this.showStats(modPlayer,targetPlayer);
        }, color: 'limegreen'}
  ]
  private playerManagementMenuPages: MenuItem[] = [
    {label: 'Back', onClick: (modPlayer:Player, targetPlayer:Player)=>{
        this.ShowMainMenuOptions(modPlayer, targetPlayer);
      }, color: 'white'},
    {label: 'Player Roles', onClick: (modPlayer:Player, targetPlayer:Player) => {
        this.ShowPlayerRolesMenuOptions(modPlayer, targetPlayer);
      }, color: 'purple'},
    {label: 'Player Permissions', onClick: (modPlayer:Player, targetPlayer:Player) => {
        this.ShowPlayerPermissions(modPlayer, targetPlayer);
      }, color: 'purple'},
    {label: 'Player Rooms Access', onClick: (modPlayer:Player, targetPlayer:Player) => {
        this.ShowPlayerRoomsAccess(modPlayer, targetPlayer);
      }, color: 'purple'}
  ];
  private VoiceSettingsMenuPages: MenuItem[] = [
    {label: 'Back', onClick: (modPlayer:Player, targetPlayer:Player)=>{
        this.ShowMainMenuOptions(modPlayer, targetPlayer);
      }, color: 'white'},
    {label: 'Mute', onClick: (modPlayer:Player, targetPlayer:Player) => {
        const playerVoiceAccess = this.world.persistentStorage.getPlayerVariable(modPlayer, CoreKey('Permissions')).toString()[this.controlledMenuPages.indexOf('Voice Settings')];
        const playerModValue = this.world.persistentStorage.getPlayerVariable(modPlayer, CoreKey('Role'));
        const hasAccess = (playerVoiceAccess == '9' || playerModValue >= managerRoleValue );
        if (hasAccess){
          targetPlayer.setVoipSetting(VoipSettingValues.Mute);
          this.errorText.set('Voice set to mute');
        } else {
          this.errorText.set('You do not have permission to set voice settings.');
        }
      }, color: 'yellow'},
    {label: 'Whisper', onClick: (modPlayer:Player, targetPlayer:Player) => {
        const playerVoiceAccess = this.world.persistentStorage.getPlayerVariable(modPlayer, CoreKey('Permissions')).toString()[this.controlledMenuPages.indexOf('Voice Settings')];
        const playerModValue = this.world.persistentStorage.getPlayerVariable(modPlayer, CoreKey('Role'));
        const hasAccess = (playerVoiceAccess == '9' || playerModValue >= managerRoleValue );
        if (hasAccess){
          targetPlayer.setVoipSetting(VoipSettingValues.Whisper);
          this.errorText.set('Voice set to whisper');
        } else {
          this.errorText.set('You do not have permission to set voice settings.');
        }
      }, color: 'yellow'},
    {label: 'Nearby', onClick: (modPlayer:Player, targetPlayer:Player) => {
        const playerVoiceAccess = this.world.persistentStorage.getPlayerVariable(modPlayer, CoreKey('Permissions')).toString()[this.controlledMenuPages.indexOf('Voice Settings')];
        const playerModValue = this.world.persistentStorage.getPlayerVariable(modPlayer, CoreKey('Role'));
        const hasAccess = (playerVoiceAccess == '9' || playerModValue >= managerRoleValue );
        if (hasAccess){
          targetPlayer.setVoipSetting(VoipSettingValues.Nearby);
          this.errorText.set('Voice set to nearby');
        } else {
          this.errorText.set('You do not have permission to set voice settings.');
        }
      }, color: 'yellow'},
    {label: 'Default', onClick: (modPlayer:Player, targetPlayer:Player) => {
        const playerVoiceAccess = this.world.persistentStorage.getPlayerVariable(modPlayer, CoreKey('Permissions')).toString()[this.controlledMenuPages.indexOf('Voice Settings')];
        const playerModValue = this.world.persistentStorage.getPlayerVariable(modPlayer, CoreKey('Role'));
        const hasAccess = (playerVoiceAccess == '9' || playerModValue >= managerRoleValue );
        if (hasAccess){
          targetPlayer.setVoipSetting(VoipSettingValues.Default);
          this.errorText.set('Voice set to default');
        } else {
          this.errorText.set('You do not have permission to set voice settings.');
        }
      }, color: 'yellow'},
    {label: 'Environment', onClick: (modPlayer:Player, targetPlayer:Player) => {
        const playerVoiceAccess = this.world.persistentStorage.getPlayerVariable(modPlayer, CoreKey('Permissions')).toString()[this.controlledMenuPages.indexOf('Voice Settings')];
        const playerModValue = this.world.persistentStorage.getPlayerVariable(modPlayer, CoreKey('Role'));
        const hasAccess = (playerVoiceAccess == '9' || playerModValue >= managerRoleValue );
        if (hasAccess){
          targetPlayer.setVoipSetting(VoipSettingValues.Environment);
          this.errorText.set('Voice set to environment');
        } else {
          this.errorText.set('You do not have permission to set voice settings.');
        }
      }, color: 'yellow'},
    {label: 'Extended', onClick: (modPlayer:Player, targetPlayer:Player) => {
        const playerVoiceAccess = this.world.persistentStorage.getPlayerVariable(modPlayer, CoreKey('Permissions')).toString()[this.controlledMenuPages.indexOf('Voice Settings')];
        const playerModValue = this.world.persistentStorage.getPlayerVariable(modPlayer, CoreKey('Role'));
        const hasAccess = (playerVoiceAccess == '9' || playerModValue >= managerRoleValue );
        if (hasAccess){
          targetPlayer.setVoipSetting(VoipSettingValues.Extended);
          this.errorText.set('Voice set to extended');
        } else {
          this.errorText.set('You do not have permission to set voice settings.');
        }
      }, color: 'yellow'},
    {label: 'Global', onClick: (modPlayer:Player, targetPlayer:Player) => {
        const playerVoiceAccess = this.world.persistentStorage.getPlayerVariable(modPlayer, CoreKey('Permissions')).toString()[this.controlledMenuPages.indexOf('Voice Settings')];
        const playerModValue = this.world.persistentStorage.getPlayerVariable(modPlayer, CoreKey('Role'));
        const hasAccess = (playerVoiceAccess == '9' || playerModValue >= managerRoleValue );
        if (hasAccess){
          targetPlayer.setVoipSetting(VoipSettingValues.Global);
          this.errorText.set('Voice set to global');
        } else {
          this.errorText.set('You do not have permission to set voice settings.');
        }
      }, color: 'yellow'}
  ];
  private teleportOptionsMenuPages: MenuItem[] = [
    {label: 'Back', onClick: (modPlayer:Player, targetPlayer:Player)=>{
        this.ShowMainMenuOptions(modPlayer, targetPlayer);
      }, color: 'white'},
  ]
  BuildTeleportPages(){
    TELEPORT_LOCATIONS.forEach((location: string) => {

      this.teleportOptionsMenuPages.push({label: location, onClick: (modPlayer:Player, targetPlayer:Player) => {
          console.log(modPlayer.name.get() + " selected Teleport:" + location + " on " + targetPlayer.name.get());
          if (RESTRICTED_TELEPORT_LOCATIONS.includes(location)) {
            let hasAccess = false;
            const modLevel = this.world.persistentStorage.getPlayerVariable(modPlayer, CoreKey('Role'));
            const modAccess = this.world.persistentStorage.getPlayerVariable(modPlayer, CoreKey('Rooms')).toString();
            const modAccessValue = modAccess[RESTRICTED_TELEPORT_LOCATIONS.indexOf(location)];
            console.log(String(modAccessValue) + " is the value of " + location + " in the mod's access list");
            if (modLevel >= managerRoleValue) hasAccess = true;
            if (modAccessValue == '9') hasAccess = true;

            if (hasAccess){
              this.TeleportPlayer(targetPlayer, location);
              this.errorText.set(' ');
            }else {
              this.errorText.set('You do not have permission to teleport to ' + location);}
          }else {
            // location is not restricted
            this.TeleportPlayer(targetPlayer, location);
            this.errorText.set(' ');
          }
        }, color: 'green'});
    })
  }
  private kickOptionsMenuPages: MenuItem[] = [
    {label: 'Back', onClick: (modPlayer:Player, targetPlayer:Player)=>{
        this.ShowMainMenuOptions(modPlayer, targetPlayer);
      }, color: 'white'},
    {label: 'Warn Player', onClick: (modPlayer:Player, targetPlayer:Player) => {
        this.world.ui.showPopupForPlayer(targetPlayer, 'This is a warning, stop what you are doing.',5,{fontColor: new Color(255,0,0), backgroundColor: new Color(0,0,0), showTimer:false, fontSize: 2});
        this.errorText.set('Player warned');
      }, color: 'orange'},
    {label: 'Kick', onClick: (modPlayer:Player, targetPlayer:Player) => {
        this.BanPlayer(modPlayer, targetPlayer, 0);
      }, color: 'orange'},
    {label: '1 Day Kick', onClick: (modPlayer:Player, targetPlayer:Player) => {
        this.BanPlayer(modPlayer, targetPlayer, 1);
      }, color: 'orange'},
    {label: '3 Day Kick', onClick: (modPlayer:Player, targetPlayer:Player) => {
        this.BanPlayer(modPlayer, targetPlayer, 3);
      }, color: 'orange'},
    {label: '7 Day Kick', onClick: (modPlayer:Player, targetPlayer:Player) => {
        this.BanPlayer(modPlayer, targetPlayer, 7);
      }, color: 'orange'},
    {label: '14 Day Kick', onClick: (modPlayer:Player, targetPlayer:Player) => {
        this.BanPlayer(modPlayer, targetPlayer, 14);
      }, color: 'orange'},
    {label: '28 Day Kick', onClick: (modPlayer:Player, targetPlayer:Player) => {
        this.BanPlayer(modPlayer, targetPlayer, 28);
      }, color: 'orange'},
    {label: '90 Day Kick', onClick: (modPlayer:Player, targetPlayer:Player) => {
        this.BanPlayer(modPlayer, targetPlayer,90);
      }, color: 'orange'},
    {label: '365 Day Kick', onClick: (modPlayer:Player, targetPlayer:Player) => {
        this.BanPlayer(modPlayer, targetPlayer, 365);
      }, color: 'orange'},
    {label: ' ', onClick: (modPlayer:Player, targetPlayer:Player) => {
        return
      }, color: 'orange'},
    {label: 'UnBan', onClick: (modPlayer:Player, targetPlayer:Player) => {
        this.world.persistentStorage.setPlayerVariable(targetPlayer, CoreKey('BanStatus'), 0);
        this.world.persistentStorage.setPlayerVariable(targetPlayer, CoreKey('BanTime'), 0);
        this.TeleportPlayer(targetPlayer, 'Respawn');
        this.errorText.set('Player unbanned');
      }, color: 'orange'},

  ];
  private playerMovementMenuPages: MenuItem[] = [
    {label: 'Back', onClick: (modPlayer:Player, targetPlayer:Player)=>{
        this.ShowMainMenuOptions(modPlayer, targetPlayer);
      }, color: 'white'},
    {label: 'Teleport to Player', onClick: (modPlayer:Player, targetPlayer:Player)=>{
        const modPlayerValue = this.world.persistentStorage.getPlayerVariable(modPlayer, CoreKey('Role'));
        const modTeleportAccess = this.world.persistentStorage.getPlayerVariable(modPlayer, CoreKey('Permissions')).toString()[this.controlledMenuPages.indexOf('Player Movement')] == '9';
        if((modPlayerValue >= moderatorRoleValue && modTeleportAccess) || modPlayerValue >= managerRoleValue){
          // Player is manager or a mod with access
          const targetPlayerLocation = targetPlayer.position.get();
          modPlayer.position.set(targetPlayerLocation);
        }else {
          if (modPlayerValue < moderatorRoleValue) {
            this.errorText.set('Only moderators can move players.');
          }else if (!modTeleportAccess) this.errorText.set('You do not have permission to move players.');
        }
      }, color: 'teal'},
    {label: 'Teleport Player to You', onClick: (modPlayer:Player, targetPlayer:Player)=>{
        const modPlayerValue = this.world.persistentStorage.getPlayerVariable(modPlayer, CoreKey('Role'));
        const modTeleportAccess = this.world.persistentStorage.getPlayerVariable(modPlayer, CoreKey('Permissions')).toString()[this.controlledMenuPages.indexOf('Player Movement')] == '9';
        if((modPlayerValue >= moderatorRoleValue && modTeleportAccess) || modPlayerValue >= managerRoleValue){
          // Player is manager or a mod with access
          this.GrabPlayer(modPlayer,targetPlayer);
        }else {
          if (modPlayerValue < moderatorRoleValue) {
            this.errorText.set('Only moderators can move players.');
          }else if (!modTeleportAccess) this.errorText.set('You do not have permission to move players.');
        }
      }, color: 'teal'},
    {label: 'Freeze Player', onClick: (modPlayer:Player, targetPlayer:Player)=>{
        const modPlayerValue = this.world.persistentStorage.getPlayerVariable(modPlayer, CoreKey('Role'));
        const modTeleportAccess = this.world.persistentStorage.getPlayerVariable(modPlayer, CoreKey('Permissions')).toString()[this.controlledMenuPages.indexOf('Player Movement')] == '9';
        if((modPlayerValue >= moderatorRoleValue && modTeleportAccess) || modPlayerValue >= managerRoleValue){
          // Player is manager or a mod with access
          targetPlayer.locomotionSpeed.set(0)

        }else {
          if (modPlayerValue < moderatorRoleValue) {
            this.errorText.set('Only moderators can move players.');
          }else if (!modTeleportAccess) this.errorText.set('You do not have permission to move players.');
        }
      }, color: 'teal'},
    {label: 'Unfreeze Player', onClick: (modPlayer:Player, targetPlayer:Player)=>{
        const modPlayerValue = this.world.persistentStorage.getPlayerVariable(modPlayer, CoreKey('Role'));
        const modTeleportAccess = this.world.persistentStorage.getPlayerVariable(modPlayer, CoreKey('Permissions')).toString()[this.controlledMenuPages.indexOf('Player Movement')] == '9';
        if((modPlayerValue >= moderatorRoleValue && modTeleportAccess) || modPlayerValue >= managerRoleValue){
          // Player is manager or a mod with access
          targetPlayer.locomotionSpeed.set(DEFAULT_PLAYER_SPEED)

        }else {
          if (modPlayerValue < moderatorRoleValue) {
            this.errorText.set('Only moderators can move players.');
          }else if (!modTeleportAccess) this.errorText.set('You do not have permission to move players.');
        }
      }, color: 'teal'},
    {label: 'Teleport Player to You / Freeze', onClick: (modPlayer:Player, targetPlayer:Player)=>{
        const modPlayerValue = this.world.persistentStorage.getPlayerVariable(modPlayer, CoreKey('Role'));
        const modTeleportAccess = this.world.persistentStorage.getPlayerVariable(modPlayer, CoreKey('Permissions')).toString()[this.controlledMenuPages.indexOf('Player Movement')] == '9';
        if((modPlayerValue >= moderatorRoleValue && modTeleportAccess) || modPlayerValue >= managerRoleValue){
          // Player is manager or a mod with access
          targetPlayer.locomotionSpeed.set(0);
          this.GrabPlayer(modPlayer,targetPlayer);

        }else {
          if (modPlayerValue < moderatorRoleValue) {
            this.errorText.set('Only moderators can move players.');
          }else if (!modTeleportAccess) this.errorText.set('You do not have permission to move players.');
        }
      }, color: 'teal'},
    {label: 'Teleport Player Back / Unfreeze', onClick: (modPlayer:Player, targetPlayer:Player)=>{
        const modPlayerValue = this.world.persistentStorage.getPlayerVariable(modPlayer, CoreKey('Role'));
        const modTeleportAccess = this.world.persistentStorage.getPlayerVariable(modPlayer, CoreKey('Permissions')).toString()[this.controlledMenuPages.indexOf('Player Movement')] == '9';
        if((modPlayerValue >= moderatorRoleValue && modTeleportAccess) || modPlayerValue >= managerRoleValue){
          // Player is manager or a mod with access
          this.ReturnPlayer(targetPlayer);
          targetPlayer.locomotionSpeed.set(DEFAULT_PLAYER_SPEED)
        }else {
          if (modPlayerValue < moderatorRoleValue) {
            this.errorText.set('Only moderators can move players.');
          }else if (!modTeleportAccess) this.errorText.set('You do not have permission to move players.');
        }
      }, color: 'teal'},

  ];
  private worldSettingsMenuPages: MenuItem[] = [
        {label: 'Back', onClick: (modPlayer:Player, targetPlayer:Player)=>{
                this.ShowMainMenuOptions(modPlayer, targetPlayer);
            }, color: 'white'},
        {label: 'Close Instance', onClick: async (modPlayer:Player, targetPlayer:Player)=>{
                this.world.matchmaking.allowPlayerJoin(false).then(()=>{
                        this.world.ui.showPopupForEveryone('This instance is now closed. Please proceed to portal or select swap session in your menu.', 5, {
                            fontColor: new Color(255, 0, 0),
                            backgroundColor: new Color(0, 0, 0),
                            showTimer: false,
                            fontSize: 2
                        });
                        this.errorText.set('Instance closed');

                });

            }, color: 'red'},
        {label: 'Reopen Instance', onClick: async (modPlayer:Player, targetPlayer:Player)=>{
                    this.world.matchmaking.allowPlayerJoin(true).then(() => {
                        this.world.ui.showPopupForEveryone('This instance will remain open. Have a great time.', 5, {
                            fontColor: new Color(255, 0, 0),
                            backgroundColor: new Color(0, 0, 0),
                            showTimer: false,
                            fontSize: 2
                        });
                        this.errorText.set('Instance reopened');
                    }
                );
            }, color: 'green'}
    ];
  private showStats(modPlayer:Player, targetPlayer:Player){
      const playerTime = this.world.persistentStorage.getPlayerVariable(targetPlayer, CoreKey('TimeInWorld'));
      const playerVisits = this.world.persistentStorage.getPlayerVariable(targetPlayer, CoreKey('VisitCount'));
      const playerKicks = this.world.persistentStorage.getPlayerVariable(targetPlayer, CoreKey('KickCount'));
      const statList:UINode[] = [
          Pressable({
              children: Text({text: 'Back', style: {color: 'white', fontSize: PREFERRED_FONT_SIZE, textAlign: 'center'}}),
              onClick: (player:Player)=>{
                  this.ShowMainMenuOptions(player, targetPlayer);
              }
          }),
          this.displayGap,this.displayGap,
          Text({text: 'Name: ' + targetPlayer.name.get(), style: {color: 'limegreen', fontSize: PREFERRED_FONT_SIZE, textAlign: 'center'}}),
          Text({text: 'Hours: ' + parseFloat((playerTime / 60).toFixed(4)), style: {color: 'limegreen', fontSize: PREFERRED_FONT_SIZE, textAlign: 'center'}}),
          Text({text: 'Visits: ' + playerVisits, style: {color: 'limegreen', fontSize: PREFERRED_FONT_SIZE, textAlign: 'center'}}),
          Text({text: 'Kicks: ' + playerKicks, style: {color: 'limegreen', fontSize: PREFERRED_FONT_SIZE, textAlign: 'center'}})
      ];
      this.displayListBinding.set(statList);
  }

  private grabbedPlayers = new Map<Player, Vec3>();
  GrabPlayer(modPlayer:Player,targetPlayer:Player){
    const playerPosition = targetPlayer.position.get();
    this.grabbedPlayers.set(targetPlayer, playerPosition);
    targetPlayer.position.set(modPlayer.position.get());

  }
  ReturnPlayer(player:Player){
    if (this.grabbedPlayers.has(player)){
      const lastPlayerPosition = this.grabbedPlayers.get(player);
      player.position.set(<Vec3>lastPlayerPosition);
      this.grabbedPlayers.delete(player);
    }
  }
  BanPlayer(modPlayer:Player, targetPlayer:Player, days:number){
    const modValue = this.world.persistentStorage.getPlayerVariable(modPlayer, CoreKey('Role'));
    const targetValue = this.world.persistentStorage.getPlayerVariable(targetPlayer, CoreKey('Role'));
    if (modValue >= moderatorRoleValue && targetValue < moderatorRoleValue){
      if (days == 0) {
        this.TeleportPlayer(targetPlayer, 'Jail');
        this.AddKick(targetPlayer);
        this.world.ui.showPopupForPlayer(targetPlayer, 'You have been kicked by a moderator', 5, {
          fontColor: new Color(255, 0, 0),
          backgroundColor: new Color(0, 0, 0),
          showTimer: false,
            fontSize: 2
        });
        this.errorText.set('Player kicked');
      } else if (days > 0 && days <= 14) {
        this.TeleportPlayer(targetPlayer, 'Jail');
        this.AddKick(targetPlayer);
        if (days == 1){this.world.ui.showPopupForPlayer(targetPlayer, 'You have been banned for ' + days + ' day by a moderator', 5, {
                fontColor: new Color(255, 0, 0),
                backgroundColor: new Color(0, 0, 0),
                showTimer: false,
            fontSize: 2
            });
        } else {this.world.ui.showPopupForPlayer(targetPlayer, 'You have been banned for ' + days + ' days by a moderator', 5, {
            fontColor: new Color(255, 0, 0),
            backgroundColor: new Color(0, 0, 0),
            showTimer: false,
            fontSize: 2
        });}
        this.world.ui.showPopupForPlayer(targetPlayer, 'You have been banned for ' + days + ' days by a moderator', 5, {
          fontColor: new Color(255, 0, 0),
          backgroundColor: new Color(0, 0, 0),
          showTimer: false,
            fontSize: 2
        });
        this.world.persistentStorage.setPlayerVariable(targetPlayer, CoreKey('BanStatus'), 5);
        this.world.persistentStorage.setPlayerVariable(targetPlayer, CoreKey('BanTime'), this.GetCurrentHour() + (days * 24));
        this.errorText.set('Player banned for ' + days + ' days.');
      } else if (days > 14) {
        if (modValue >= managerRoleValue) {
          this.TeleportPlayer(targetPlayer, 'Jail');
          this.AddKick(targetPlayer);
          this.world.ui.showPopupForPlayer(targetPlayer, 'You have been banned for ' + days + ' days by a manager', 5, {
            fontColor: new Color(255, 0, 0),
            backgroundColor: new Color(0, 0, 0),
            showTimer: false,
            fontSize: 2
          });
          this.world.persistentStorage.setPlayerVariable(targetPlayer, CoreKey('BanStatus'), 5);
          this.world.persistentStorage.setPlayerVariable(targetPlayer, CoreKey('BanTime'), this.GetCurrentHour() + (days * 24));
          this.errorText.set('Player banned for ' + days + ' days.');
        }else this.errorText.set('Only managers can ban players for more than 14 days.');
      }
    }else {
      if (modValue < moderatorRoleValue)this.errorText.set('You do not have permission to ban players.');
      else if (targetValue >= moderatorRoleValue)this.errorText.set('Moderators cannot be banned, please remove moderator status from the player.');
    }

  }
  BanCheck(player:Player){
    console.log(this.GetCurrentHour() + ' Ban Check called for ' + player.name.get());
    const playerBanStatus = this.world.persistentStorage.getPlayerVariable(player, CoreKey('BanStatus'));
    const playerBanTime = this.world.persistentStorage.getPlayerVariable(player, CoreKey('BanTime'));
    if (playerBanStatus == 5) {
      if (playerBanTime <= this.GetCurrentHour()){
        // Unbanning Player
        this.world.persistentStorage.setPlayerVariable(player, CoreKey('BanStatus'), 0);
        this.world.persistentStorage.setPlayerVariable(player, CoreKey('BanTime'), 0);
        this.TeleportPlayer(player, 'Respawn');
      }else {
        this.TeleportPlayer(player, 'Jail');
        this.world.ui.showPopupForPlayer(player, 'You have been banned from this world you have ' + (playerBanTime - this.GetCurrentHour()) + ' hours remaining', 5, {
          fontColor: new Color(255, 0, 0),
          backgroundColor: new Color(0, 0, 0),
          showTimer: false,
            fontSize: 2
        });
      }
    }
  }
  GetCurrentHour(){
    return Math.floor(Date.now() /1000 / 60 / 60)
  }
  AddKick(player:Player){
      const currentKicks = this.world.persistentStorage.getPlayerVariable(player, CoreKey('KickCount'));
      this.world.persistentStorage.setPlayerVariable(player, CoreKey('KickCount'), currentKicks + 1);
  }



  TeleportPlayer(targetPlayer:Player, location:string){
    //TODO this needs to be written
    console.log(targetPlayer.name.get() + " teleported to " + location);
    // @ts-ignore: Object is recognized as type 'Never' and does not allow compilation but syntax is valid
    this.props[location].as(SpawnPointGizmo).teleportPlayer(targetPlayer);
  }
  ResolvePlayerColor(player:Player){
    const worldValues = this.world.persistentStorage
    const playerModValue:number = worldValues.getPlayerVariable(player,CoreKey('Role'));
    return ROLES[String(playerModValue)].color;
  }

  CreatePlayerList(){
    let tempList: UINode[] = [];
    this.playerList.forEach((targetPlayer: Player) => {
      tempList.push(Pressable({
        children: Text({text: targetPlayer.name.get(), style: {color: this.ResolvePlayerColor(targetPlayer), fontSize: PREFERRED_FONT_SIZE, textAlign: 'center'}}),
        onClick: (modPlayer:Player)=>{
          this.targetPlayerNameText.set('Selected: ' + targetPlayer.name.get());
          this.ShowMainMenuOptions(modPlayer, targetPlayer);
        }
        }));
    })
    this.displayListBinding.set(tempList);
  }



  panelName = 'ModTool';
  panelHeight = calculatedPanelHeight;
  panelWidth = 600;
  InitializePersistentVariables(player:Player){
    const persistentStorageValues = this.world.persistentStorage;
    const userRooms = persistentStorageValues.getPlayerVariable(player, CoreKey('Rooms'));
    if (userRooms == 0) {
      const defaultRoomValue = Number('1'.repeat(RESTRICTED_TELEPORT_LOCATIONS.length));
      this.world.persistentStorage.setPlayerVariable(player, CoreKey('Rooms'), defaultRoomValue);
    }
    const userPermissions = persistentStorageValues.getPlayerVariable(player, CoreKey('Permissions'));
    if (userPermissions == 0) {
      const defaultPermissionValue = Number('1'.repeat(this.controlledMenuPages.length));
      this.world.persistentStorage.setPlayerVariable(player, CoreKey('Permissions'), defaultPermissionValue);
    }

  }
  AddToPlayerList(player:Player){
    if (!this.playerList.find((p:Player)=>p.name.get() == player.name.get())){
      this.playerList.push(player)
    }
    // Update the displayed list of players if it is currently being accessed
    if (this.currentPage == 'PlayerList') {
      this.ShowPlayerList()
    }
  }
  RemoveFromPlayerList(player:Player){
    if (this.playerList.find((p:Player)=>p.name.get() == player.name.get())){
      this.playerList.splice(this.playerList.indexOf(<Player>this.playerList.find((p: Player) => p.name.get() == player.name.get())),1)
    }
    // Update the displayed list of players if it is currently being accessed
    if (this.currentPage == 'PlayerList') {
      this.ShowPlayerList()
    }
  }

  start() {
    this.playerList.splice(0, this.playerList.length);
    this.playerList.push(...this.world.getPlayers());
    this.playerList.forEach((player:Player) => {this.BanCheck(player)})
    this.BuildTeleportPages();
    this.connectCodeBlockEvent(
        this.entity,
        CodeBlockEvents.OnPlayerEnterWorld,
        (player:Player)=> {
          this.PlayerEnterWorld(player)
        }
    );
    this.connectCodeBlockEvent(
        this.entity,
        CodeBlockEvents.OnPlayerExitWorld,
        (player:Player)=> {
          this.PlayerExitWorld(player)

        }
    )
    this.ShowPlayerList()
  }
  PlayerEnterWorld(player: Player) {
    this.AddToPlayerList(player);
    this.InitializePersistentVariables(player);
    this.BanCheck(player);
  }
  PlayerExitWorld(player: Player) {
    this.RemoveFromPlayerList(player)
    if (this.grabbedPlayers.has(player)){this.grabbedPlayers.delete(player)}
  }
  ShowPlayerList(){
    this.currentPage = 'PlayerList';
    this.targetPlayerNameText.set(' ');
    this.errorText.set(' ');
    if (this.playerList.length === 0) {
      this.displayListBinding.set(this.noPlayersText);
    }else {
      this.CreatePlayerList();
    }
  }
  BuildMenu(modPlayer:Player, targetPlayer: Player, menuOptions: MenuItem[]) {
    let tempList: UINode[] = [];
    menuOptions.forEach((page: MenuItem) => {
      tempList.push(Pressable({
        children: Text({text: page.label, style: {color: page.color, fontSize: PREFERRED_FONT_SIZE, textAlign: 'center'}}),
        onClick: (player:Player) => {page.onClick(player, targetPlayer)}
      }));
    })
    this.displayListBinding.set(tempList);
  }

  ShowMainMenuOptions(modPlayer:Player, targetPlayer:Player){
    this.currentPage = 'MenuOptions';
    this.errorText.set(' ');
    let tempList: UINode[] = [];
    const modLevel = this.world.persistentStorage.getPlayerVariable(modPlayer, CoreKey('Role'));
    const modPermissions = this.world.persistentStorage.getPlayerVariable(modPlayer, CoreKey('Permissions')).toString();
    this.mainMenuPages.forEach((page: MenuItem) => {
      // TODO check the player level here
      if (modLevel < managerRoleValue && page.label == 'Player Management') return;
      if (this.controlledMenuPages.includes(page.label) && modLevel < managerRoleValue) {
        const pageAccessValue = modPermissions[this.controlledMenuPages.indexOf(page.label)];
        if (!(pageAccessValue == '9')) return;
      }
      tempList.push(Pressable({
        children: Text({text: page.label, style: {color: page.color, fontSize: PREFERRED_FONT_SIZE, textAlign: 'center'}}),
        onClick: (player:Player) => {page.onClick(player, targetPlayer)}
      }));
    })
    tempList.push(this.displayGap);
    tempList.push(this.resetButton);
    this.displayListBinding.set(tempList);
  }

  ShowTeleportOptionsMenuOptions(modPlayer:Player, targetPlayer:Player){
    this.currentPage = 'TeleportOptions';
    this.BuildMenu(modPlayer, targetPlayer, this.teleportOptionsMenuPages);
  }
  ShowPlayerRolesMenuOptions(modPlayer:Player, targetPlayer:Player){
    this.currentPage = 'PlayerRoles';
    let tempList: UINode[] = [Pressable({
      children: Text({text: 'Back', style: {color: 'white', fontSize: PREFERRED_FONT_SIZE, textAlign: 'center'}}),
      onClick: (player:Player) => {
          this.currentPage = 'PlayerManagement';
          this.errorText.set(' ');
          this.BuildMenu(modPlayer, targetPlayer, this.playerManagementMenuPages);
      }
    })];
    roleValues.forEach((role: RoleValue) => {
      const modLevel = this.world.persistentStorage.getPlayerVariable(modPlayer, CoreKey('Role'));
      const targetLevel = this.world.persistentStorage.getPlayerVariable(targetPlayer, CoreKey('Role'));
      let tempColor = 'red'
      if (targetLevel >= role.roleLevelValue) tempColor = 'green';
      if (role.name == 'Owner'){
        tempList.push(Text({text: role.name, style: {color: 'white', fontSize: PREFERRED_FONT_SIZE, textAlign: 'center', backgroundColor: tempColor}}))
      } else{
        tempList.push(Pressable({
          children: Text({
            text: role.name,
            style: {color: 'white', fontSize: PREFERRED_FONT_SIZE, textAlign: 'center', backgroundColor: tempColor}
          }),
          onClick: (player: Player) => {
            if (modLevel > role.roleLevelValue && modLevel > targetLevel) {
              if (role.name == 'Manager') {
                this.world.persistentStorage.setPlayerVariable(targetPlayer, CoreKey('Rooms'), Number('9'.repeat(RESTRICTED_TELEPORT_LOCATIONS.length)));
                this.world.persistentStorage.setPlayerVariable(targetPlayer, CoreKey('Permissions'), Number('9'.repeat(this.controlledMenuPages.length)));
              }
              if (role.name == 'Player') {
                this.world.persistentStorage.setPlayerVariable(targetPlayer, CoreKey('Rooms'), Number('1'.repeat(RESTRICTED_TELEPORT_LOCATIONS.length)));
                this.world.persistentStorage.setPlayerVariable(targetPlayer, CoreKey('Permissions'), Number('1'.repeat(this.controlledMenuPages.length)));
              }
              this.world.persistentStorage.setPlayerVariable(targetPlayer, CoreKey('Role'), role.roleLevelValue);
              this.errorText.set(' ');
            } else {
              if (modLevel < role.roleLevelValue) this.errorText.set('You do not have permission assign this role.');
              if (modLevel <= targetLevel) this.errorText.set('You do not have permission to change this player\'s role.');
            }
            this.ShowPlayerRolesMenuOptions(player, targetPlayer);
          }
        }));
      }
    })
    this.displayListBinding.set(tempList);

  }
  ShowPlayerRoomsAccess(modPlayer:Player, targetPlayer:Player){
    this.currentPage = 'PlayerRoomsAccess';
    let tempList: UINode[] = [
        Pressable({
      children: Text({text: 'Back', style: {color: 'white', fontSize: PREFERRED_FONT_SIZE, textAlign: 'center'}}),
      onClick: (player:Player) => {
          this.currentPage = 'PlayerManagement';
          this.errorText.set(' ');
          this.BuildMenu(player, targetPlayer, this.playerManagementMenuPages);
      }
    }),
      Pressable({
        children: Text({text: 'Add all rooms', style: {color: 'white', fontSize: PREFERRED_FONT_SIZE, textAlign: 'center'}}),
        onClick: (player:Player) => {
          const modLevel = this.world.persistentStorage.getPlayerVariable(modPlayer, CoreKey('Role'));
          const targetLevel = this.world.persistentStorage.getPlayerVariable(targetPlayer, CoreKey('Role'));
          if (modLevel > targetLevel) {
            let newAccess = Number('9'.repeat(RESTRICTED_TELEPORT_LOCATIONS.length));
            this.world.persistentStorage.setPlayerVariable(targetPlayer, CoreKey('Rooms'), newAccess);
            this.errorText.set(' ');
            this.ShowPlayerRoomsAccess(player, targetPlayer);
          }else {
            this.errorText.set('You do not have permission to change this player\'s access.');
          }
        }
      }),
      Pressable({
        children: Text({text: 'Remove all rooms', style: {color: 'white', fontSize: PREFERRED_FONT_SIZE, textAlign: 'center'}}),
        onClick: (player:Player) => {
          const modLevel = this.world.persistentStorage.getPlayerVariable(modPlayer, CoreKey('Role'));
          const targetLevel = this.world.persistentStorage.getPlayerVariable(targetPlayer, CoreKey('Role'));
          if (modLevel > targetLevel) {
            let newAccess = Number('1'.repeat(RESTRICTED_TELEPORT_LOCATIONS.length));
            this.world.persistentStorage.setPlayerVariable(targetPlayer, CoreKey('Rooms'), newAccess);
            this.errorText.set(' ');
            this.ShowPlayerRoomsAccess(player, targetPlayer);
          }else {
            this.errorText.set('You do not have permission to change this player\'s access.');
          }
        }
      })];
    const modLevel = this.world.persistentStorage.getPlayerVariable(modPlayer, CoreKey('Role'));
    const targetLevel = this.world.persistentStorage.getPlayerVariable(targetPlayer, CoreKey('Role'));
    const roomsAccess = this.world.persistentStorage.getPlayerVariable(targetPlayer, CoreKey('Rooms')).toString();
    for (let i = 0; i < RESTRICTED_TELEPORT_LOCATIONS.length; i++) {

      let tempColor = 'red'
      const hasAccess = roomsAccess[i] == '9';
      if (hasAccess) tempColor = 'green';
      tempList.push(Pressable({
        children: Text({text: RESTRICTED_TELEPORT_LOCATIONS[i], style: {color: 'white', fontSize: PREFERRED_FONT_SIZE, textAlign: 'center', backgroundColor: tempColor}}),
        onClick: (player:Player) => {
          console.log(RESTRICTED_TELEPORT_LOCATIONS[i] + " was clicked");
          if (modLevel > targetLevel) {
            console.log('Mod level is greater than target level')
            let newAccess = roomsAccess;
            if (hasAccess) {newAccess = newAccess.slice(0, i) + '1' + newAccess.slice(i + 1)}
            else {newAccess = newAccess.slice(0, i) + '9' + newAccess.slice(i + 1)}
            this.world.persistentStorage.setPlayerVariable(targetPlayer, CoreKey('Rooms'), Number(newAccess));
            this.errorText.set(' ');
            this.ShowPlayerRoomsAccess(player, targetPlayer);
          }else {
            console.log('Mod level is less than target level')
            this.errorText.set('You do not have permission to change this player\'s access.');
          }
        }
      }));
    }
    this.displayListBinding.set(tempList);
  }
  ShowPlayerPermissions(modPlayer:Player, targetPlayer:Player){
    this.currentPage = 'PlayerPermissions';
    let tempList: UINode[] = [
      Pressable({
        children: Text({text: 'Back', style: {color: 'white', fontSize: PREFERRED_FONT_SIZE, textAlign: 'center'}}),
        onClick: (player:Player) => {
            this.currentPage = 'PlayerManagement';
            this.errorText.set(' ');
            this.BuildMenu(player, targetPlayer, this.playerManagementMenuPages);
        }
      }),
      Pressable({
        children: Text({text: 'Add all permissions', style: {color: 'white', fontSize: PREFERRED_FONT_SIZE, textAlign: 'center'}}),
        onClick: (player:Player) => {
          const modLevel = this.world.persistentStorage.getPlayerVariable(player, CoreKey('Role'));
          const targetLevel = this.world.persistentStorage.getPlayerVariable(targetPlayer, CoreKey('Role'));
          if (modLevel >= managerRoleValue && targetLevel < managerRoleValue) {
            let newPermissions = Number('9'.repeat(this.controlledMenuPages.length));
            this.world.persistentStorage.setPlayerVariable(targetPlayer, CoreKey('Permissions'), newPermissions);
            this.errorText.set(' ');
            this.ShowPlayerPermissions(player, targetPlayer);
          }else {
            if (modLevel < managerRoleValue) this.errorText.set('Only Managers and owners can assign permissions.');
            if (targetLevel >= managerRoleValue) this.errorText.set('Permissions cannot be modified on managers and owners.');
          }
        }
      }),
      Pressable({
        children: Text({text: 'Remove all permissions', style: {color: 'white', fontSize: PREFERRED_FONT_SIZE, textAlign: 'center'}}),
        onClick: (player:Player) => {
          const modLevel = this.world.persistentStorage.getPlayerVariable(player, CoreKey('Role'));
          const targetLevel = this.world.persistentStorage.getPlayerVariable(targetPlayer, CoreKey('Role'));
          if (modLevel >= managerRoleValue && targetLevel < managerRoleValue) {
            let newPermissions = Number('1'.repeat(this.controlledMenuPages.length));
            this.world.persistentStorage.setPlayerVariable(targetPlayer, CoreKey('Permissions'), newPermissions);
            this.errorText.set(' ');
            this.ShowPlayerPermissions(player, targetPlayer);
          }else {
            if (modLevel < managerRoleValue) this.errorText.set('Only Managers and owners can assign permissions.');
            if (targetLevel >= managerRoleValue) this.errorText.set('Permissions cannot be modified on managers and owners.');
          }
        }
      })];
    const modLevel = this.world.persistentStorage.getPlayerVariable(modPlayer, CoreKey('Role'));
    const targetLevel = this.world.persistentStorage.getPlayerVariable(targetPlayer, CoreKey('Role'));
    const playerPermissions = this.world.persistentStorage.getPlayerVariable(targetPlayer, CoreKey('Permissions')).toString();
    for (let i = 0; i < this.controlledMenuPages.length; i++) {

      let tempColor = 'red'
      const hasAccess = playerPermissions[i] == '9';
      if (hasAccess) tempColor = 'green';
      tempList.push(Pressable({
        children: Text({text: this.controlledMenuPages[i], style: {color: 'white', fontSize: PREFERRED_FONT_SIZE, textAlign: 'center', backgroundColor: tempColor}}),
        onClick: (player:Player) => {
          console.log(this.controlledMenuPages[i] + " was clicked");
          if (modLevel >= managerRoleValue && targetLevel < managerRoleValue) {
            let newPermissions = playerPermissions;
            if (hasAccess) {newPermissions = newPermissions.slice(0, i) + '1' + newPermissions.slice(i + 1)}
            else {newPermissions = newPermissions.slice(0, i) + '9' + newPermissions.slice(i + 1)}
            this.world.persistentStorage.setPlayerVariable(targetPlayer, CoreKey('Permissions'), Number(newPermissions));
            this.errorText.set(' ');
            this.ShowPlayerPermissions(player, targetPlayer);
          }else {
            if (modLevel < managerRoleValue) this.errorText.set('Only Managers and owners can assign permissions.');
            if (targetLevel >= managerRoleValue) this.errorText.set('Permissions cannot be modified on managers and owners.');
          }
        }
      }));
    }
    this.displayListBinding.set(tempList);
  }
  initializeUI() {

    return View({

      children:[this.header1, this.header2, this.displayGap, this.playerNameDisplay, this.errorDisplay,DynamicList({data: this.displayListBinding, renderItem : (pressableItem: UINode)=> {
          return pressableItem;
        }, style: {width: 500,}})],
      style: {
        flexDirection: 'column',
        backgroundColor: 'black',
        width: 500,
        height: 1400,},
    });
  }
}
UIComponent.register(ModTool);