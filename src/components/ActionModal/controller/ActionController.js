import Cosmos from "@lunie/cosmos-js"
import config from "src/config"
import { getSigner } from "./signer"
import transaction from "./transactionTypes"

import {
  createMessage,
  createMultiMessage,
  createMessageArguments,
  convertGasPriceData
} from "./messageHelpers.js"

class ActionController {
  setContext(context) {
    this.context = context
    this.cosmos = new Cosmos(context.url, context.chainId)
  }

  async simulate(type, transactionProperties) {
    const txArguments = createMessageArguments(
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

    const message = createMessage(
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
    const txArguments = createMessageArguments(
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
      message = createMessage(
        this.cosmos,
        type,
        this.context.session.address,
        txArguments
      )
    }

    const { included } = await message.send(
      {
        gas: String(gasEstimate),
        gas_prices: convertGasPriceData([gasPrices]),
        memo: transactionProperties.memo
      },
      signer
    )
    await included()
  }
}

export default ActionController
