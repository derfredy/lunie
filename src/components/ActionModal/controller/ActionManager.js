import Cosmos from "@lunie/cosmos-js"
import config from "src/config"
import { getSigner } from "./signer"
import transaction from "./transactionTypes"

import {
  createCosmosMessage,
  createMultiMessage,
  formatCosmosArguments,
  convertCurrencyData
} from "./cosmosMessages"

class ActionManager {
  setContext(context) {
    this.context = context
    this.cosmos = new Cosmos(context.url, context.chainId)
  }

  async simulate(type, transactionProperties) {
    if (!this.context.connected) {
      throw Error(
        `Currently not connected to a secure node. Please try again when Lunie has secured a connection.`
      )
    }

    const txArguments = formatCosmosArguments(
      this.context,
      type,
      transactionProperties,
      true
    )

    if (txArguments === null) {
      throw Error(
        `Did not complete transaction simulation. Invalid message type: ${type}.`
      )
    }

    const message = createCosmosMessage(
      this.cosmos,
      type,
      this.context.session.address,
      txArguments
    )
    const gasEstimate = await message.simulate({
      memo: transactionProperties.memo
    })
    return gasEstimate
  }

  async send(
    type,
    transactionProperties,
    gasEstimate,
    gasPrices,
    submitType,
    password
  ) {
    if (!this.context.connected) {
      throw Error(
        `Currently not connected to a secure node. Please try again when Lunie has secured a connection.`
      )
    }

    const txArguments = formatCosmosArguments(
      this.context,
      type,
      transactionProperties
    )

    if (txArguments === null) {
      throw Error(
        `Did not complete transaction. Invalid message type: ${type}.`
      )
    }

    const localKeyPairName = this.context.session.localKeyPairName
    const signer = getSigner(config, submitType, { localKeyPairName, password })

    let message
    if (type === transaction.WITHDRAW) {
      message = createMultiMessage(
        this.cosmos,
        type,
        this.context.session.address,
        txArguments
      )
    } else {
      message = createCosmosMessage(
        this.cosmos,
        type,
        this.context.session.address,
        txArguments
      )
    }

    const { included } = await message.send(
      {
        gas: String(gasEstimate),
        gas_prices: convertCurrencyData([gasPrices]),
        memo: transactionProperties.memo
      },
      signer
    )
    await included()
  }
}

export default ActionManager
