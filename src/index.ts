import {
  AptosWalletErrorResult,
  NetworkName,
  PluginProvider,
} from "@aptos-labs/wallet-adapter-core";
import type {
  AccountInfo,
  AdapterPlugin,
  NetworkInfo,
  SignMessagePayload,
  SignMessageResponse,
  WalletName,
} from "@aptos-labs/wallet-adapter-core";
import { Types } from "aptos";
import { LOGO_PNG_BASE64 } from "./logo";

interface Coin98Provider extends Omit<PluginProvider, "connect" | "network"> {
  connect(config: { network: NetworkName }): Promise<AccountInfo>;
  signTransaction(
    transaction: any,
    options?: any
  ): Promise<Uint8Array | AptosWalletErrorResult>;
  network(): Promise<NetworkInfo>;
}

interface Coin98Window extends Window {
  coin98Aptos?: Coin98Provider;
}

declare const window: Coin98Window;

export const Coin98WalletName = "Coin98" as WalletName<"Coin98">;

export interface Coin98WalletAdapterConfig {
  network?: NetworkName;
}

export class Coin98Wallet implements AdapterPlugin {
  readonly name = Coin98WalletName;
  readonly url =
    "https://chrome.google.com/webstore/detail/coin98-wallet/aeachknmefphepccionboohckonoeemg";
  readonly icon = `data:image/png;base64,${LOGO_PNG_BASE64}` as const;
  providerName = "coin98Aptos";
  provider: Coin98Provider | undefined =
    typeof window !== "undefined" ? window.coin98Aptos : undefined;

  protected _network:
    | NetworkName.Mainnet
    | NetworkName.Testnet
    | NetworkName.Devnet;

  constructor({ network = NetworkName.Mainnet }: Coin98WalletAdapterConfig) {
    this._network = network;
  }

  async connect(): Promise<AccountInfo> {
    try {
      const accountInfo = await this.provider?.connect({
        network: this._network,
      });
      if (!accountInfo) throw `${Coin98WalletName} Address Info Error`;
      return accountInfo;
    } catch (error: any) {
      throw error;
    }
  }

  async account(): Promise<AccountInfo> {
    const response = await this.provider?.account();
    if (!response) throw `${Coin98WalletName} Account Error`;
    return response;
  }

  async disconnect(): Promise<void> {
    try {
      await this.provider?.disconnect();
    } catch (error: any) {
      throw error;
    }
  }

  async signAndSubmitTransaction(
    transaction: Types.TransactionPayload,
    options?: any
  ): Promise<{ hash: Types.HexEncodedBytes }> {
    try {
      const response = await this.provider?.signAndSubmitTransaction(
        transaction,
        options
      );
      if ((response as AptosWalletErrorResult).code) {
        throw new Error((response as AptosWalletErrorResult).message);
      }
      return response as { hash: Types.HexEncodedBytes };
    } catch (error: any) {
      const errMsg = error.message;
      throw errMsg;
    }
  }

  async signTransaction(
    transaction: Types.TransactionPayload,
    options?: any
  ): Promise<Uint8Array | AptosWalletErrorResult> {
    try {
      const response = await this.provider?.signTransaction(
        transaction,
        options
      );
      if (!response) {
        throw new Error("No response") as AptosWalletErrorResult;
      }
      return response;
    } catch (error: any) {
      const errMsg = error.message;
      throw errMsg;
    }
  }

  async signMessage(message: SignMessagePayload): Promise<SignMessageResponse> {
    try {
      if (typeof message !== "object" || !message.nonce) {
        `${Coin98WalletName} Invalid signMessage Payload`;
      }
      const response = await this.provider?.signMessage(message);
      if (response) {
        return response;
      } else {
        throw `${Coin98WalletName} Sign Message failed`;
      }
    } catch (error: any) {
      const errMsg = error.message;
      throw errMsg;
    }
  }

  async network(): Promise<NetworkInfo> {
    try {
      const response = await this.provider?.network();
      if (!response) throw `${Coin98WalletName} Network Error`;
      return {
        name: response.name.toLocaleLowerCase() as NetworkName,
      };
    } catch (error: any) {
      throw error;
    }
  }

  async onNetworkChange(callback: any): Promise<void> {
    try {
      const handleNetworkChange: any = async (newNetwork: {
        networkName: NetworkInfo;
      }): Promise<void> => {
        callback({
          name: newNetwork.networkName,
          chainId: undefined,
          api: undefined,
        });
      };
      await this.provider?.onNetworkChange(handleNetworkChange);
    } catch (error: any) {
      const errMsg = error.message;
      throw errMsg;
    }
  }

  async onAccountChange(callback: any): Promise<void> {
    try {
      const handleAccountChange = async (
        newAccount: AccountInfo
      ): Promise<void> => {
        if (newAccount?.publicKey) {
          callback({
            publicKey: newAccount.publicKey,
            address: newAccount.address,
          });
        } else {
          const response = await this.connect();
          callback({
            address: response?.address,
            publicKey: response?.publicKey,
          });
        }
      };
      await this.provider?.onAccountChange(handleAccountChange);
    } catch (error: any) {
      console.log(error);
      const errMsg = error.message;
      throw errMsg;
    }
  }
}
