import MMOClient from "./MMOClient";
import IStream from "./IStream";
import MMOConfig from "./MMOConfig";
import IConnection from "./IConnection";

export default class MMOConnection<T extends MMOClient> implements IConnection {
  private _client!: T;

  private _stream: IStream;

  constructor(config: MMOConfig) {
    this._stream = config.stream;
    this._stream.setDataCallback((buf: Uint8Array) => this.read(buf));
    this._stream.connect(config.loginServerIp, config.loginServerPort);
  }

  get Client(): T {
    return this._client;
  }

  set Client(client: T) {
    this._client = client;
  }

  async write(buf: Uint8Array): Promise<boolean> {
    return this._stream.send(buf);
  }

  read(data: Uint8Array): void {
    this._client.process(data);
  }

  close(): void {
    this._stream.close();
  }
}
