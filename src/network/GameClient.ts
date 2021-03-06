import L2Buff from "../entities/L2Buff";
import L2Creature from "../entities/L2Creature";
import L2DroppedItem from "../entities/L2DroppedItem";
import L2Item from "../entities/L2Item";
import L2Object from "../entities/L2Object";
import L2ObjectCollection from "../entities/L2ObjectCollection";
import L2PartyMember from "../entities/L2PartyMember";
import L2Skill from "../entities/L2Skill";
import L2User from "../entities/L2User";
import MMOClient from "../mmocore/MMOClient";
import MMOConfig from "../mmocore/MMOConfig";
import MMOConnection from "../mmocore/MMOConnection";
import NetSocket from "../mmocore/NetSocket";
import GameCrypt from "../security/crypt/GameCrypt";
import GamePacketHandler from "./GamePacketHandler";
import LoginClient from "./LoginClient";
import GameServerPacket from "./serverpackets/GameServerPacket";
import ProtocolVersion from "./serverpackets/ProtocolVersion";

export default class GameClient extends MMOClient {
  private _loginClient: LoginClient;

  private _gameCrypt: GameCrypt;

  private _config!: MMOConfig;

  private _activeChar: L2User = new L2User();
  private _creatures: L2ObjectCollection<L2Creature> = new L2ObjectCollection();
  private _party: L2ObjectCollection<L2PartyMember> = new L2ObjectCollection();
  private _droppedItems: L2ObjectCollection<L2DroppedItem> = new L2ObjectCollection();
  private _items: L2ObjectCollection<L2Item> = new L2ObjectCollection();
  private _buffs: L2ObjectCollection<L2Buff> = new L2ObjectCollection();
  private _skills: L2ObjectCollection<L2Skill> = new L2ObjectCollection();

  get CreaturesList(): L2ObjectCollection<L2Creature> {
    return this._creatures;
  }

  get PartyList(): L2ObjectCollection<L2PartyMember> {
    return this._party;
  }

  get DroppedItems(): L2ObjectCollection<L2DroppedItem> {
    return this._droppedItems;
  }

  get InventoryItems(): L2ObjectCollection<L2Item> {
    return this._items;
  }

  get BuffsList(): L2ObjectCollection<L2Buff> {
    return this._buffs;
  }

  get SkillsList(): L2ObjectCollection<L2Skill> {
    return this._skills;
  }

  get PlayOk1(): number {
    return this._loginClient.PlayOk1;
  }

  get PlayOk2(): number {
    return this._loginClient.PlayOk2;
  }

  get LoginOk1(): number {
    return this._loginClient.LoginOk1;
  }

  get LoginOk2(): number {
    return this._loginClient.LoginOk2;
  }

  get Username(): string {
    return this._loginClient.Username;
  }

  get Config(): MMOConfig {
    return this._config;
  }

  set Config(config: MMOConfig) {
    this._config = config;
  }

  get ActiveChar(): L2User {
    return this._activeChar;
  }

  set ActiveChar(char: L2User) {
    this._activeChar = char;
  }

  constructor(lc: LoginClient, config: MMOConfig) {
    super(
      new MMOConnection(
        config.assign({
          stream: new NetSocket(),
          loginServerIp: lc.SelectedServer.Ipv4(),
          loginServerPort: lc.SelectedServer.Port,
        })
      )
    );

    this.Config = config;
    (this.Connection as MMOConnection<GameClient>).Client = this;
    this.PacketHandler = new GamePacketHandler();

    this._loginClient = lc;
    this._gameCrypt = new GameCrypt();

    this.sendPacket(new ProtocolVersion());
  }
  encrypt(buf: Uint8Array, offset: number, size: number): void {
    this._gameCrypt.encrypt(buf, offset, size);
  }
  decrypt(buf: Uint8Array, offset: number, size: number): void {
    this._gameCrypt.decrypt(buf, offset, size);
  }
  setCryptInitialKey(key: Uint8Array): void {
    this._gameCrypt.setKey(key);
  }

  sendPacket(gsp: GameServerPacket): void {
    gsp.write();

    this._gameCrypt.encrypt(gsp.Buffer, 0, gsp.Position);

    const sendable: Uint8Array = new Uint8Array(gsp.Position + 2);
    sendable[0] = (gsp.Position + 2) & 0xff;
    sendable[1] = (gsp.Position + 2) >>> 8;
    sendable.set(gsp.Buffer.slice(0, gsp.Position), 2);

    console.info("sending..", gsp.constructor.name);
    this.Connection.write(sendable).catch((error) => {
      console.error(error);
    });
  }
}
