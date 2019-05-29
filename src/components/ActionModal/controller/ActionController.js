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

const URL = "https://stargate.lunie.io" //config.stargate
const CHAIN_ID = "cosmoshub-2" // TODO get from context
const ORIGIN_ADDRESS = "" // TODO get from context

// Need to provide a context object that contains relevant information
// like validator lists, available atoms etc.
class ActionController {
  constructor(
    context = {},
    url = URL,
    chainId = CHAIN_ID,
    senderAddress = ORIGIN_ADDRESS
  ) {
    this.url = url
    this.chainId = chainId
    this.senderAddress = senderAddress
    this.context = context
    this.connected = () => true

    console.log(JSON.stringify(this.context, null, 2))
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

    const cosmos = new Cosmos(this.url, this.chainId)
    const message = createMessage(cosmos, type, this.senderAddress, txArguments)
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

    const localKeyPairName = "" // TODO
    const signer = getSigner(config, submitType, { localKeyPairName, password })

    let message
    const cosmos = new Cosmos(this.url, this.chainId)
    if (type === transaction.WITHDRAW) {
      message = createMultiMessage(
        cosmos,
        type,
        this.senderAddress,
        txArguments
      )
    } else {
      message = createMessage(cosmos, type, this.senderAddress, txArguments)
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
