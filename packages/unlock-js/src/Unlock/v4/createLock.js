import ethersUtils from '../../utils'
import { ETHERS_MAX_UINT, UNLIMITED_KEYS_COUNT, ZERO } from '../../constants'

import { getErc20Decimals } from '../../erc20'
import { _getKeyPrice } from '../utils'

/**
 * Creates a lock on behalf of the user, using version v4
 * @param {PropTypes.lock} lock
 * @param {function} callback invoked with the transaction hash
 */
export default async function (lock, transactionOptions = {}, callback) {
  const unlockContract = await this.getUnlockContract()
  let { maxNumberOfKeys } = lock
  if (
    typeof maxNumberOfKeys !== 'number' ||
    maxNumberOfKeys === UNLIMITED_KEYS_COUNT
  ) {
    maxNumberOfKeys = ETHERS_MAX_UINT
  }

  const decimalKeyPrice = _getKeyPrice(lock, this.provider)

  const currencyContractAddress = lock.currencyContractAddress || ZERO

  const lockName = lock.name || 'New Lock'
  const transactionPromise = unlockContract.functions[
    'createLock(uint256,address,uint256,uint256,string)'
  ](
    lock.expirationDuration,
    currencyContractAddress,
    decimalKeyPrice,
    maxNumberOfKeys,
    lockName
  )
  const hash = await this._handleMethodCall(transactionPromise)

  if (callback) {
    callback(null, hash, await transactionPromise)
  }
  // Let's now wait for the lock to be deployed before we return its address
  const { logs } = await this.provider.waitForTransaction(hash)
  const parsedLogs = logs
    .map((log) => unlockContract.interface.parseLog(log))
    .map((log) => log || {})

  const newLockEvent = parsedLogs.find(
    ({ fragment }) =>
      fragment && fragment.signature === 'NewLock(address,address)'
  )

  if (newLockEvent) {
    return newLockEvent.args.newLockAddress
  }
  // There was no NewEvent log (transaction failed?)
  return null
}
