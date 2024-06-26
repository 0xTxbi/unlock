import ethersUtils from '../../utils'
import { ETHERS_MAX_UINT, UNLIMITED_KEYS_COUNT, ZERO } from '../../constants'

import { getErc20Decimals } from '../../erc20'
import { _getKeyPrice } from '../utils'

/**
 * Creates a lock on behalf of the user, using version v6
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

  const decimalKeyPrice = await _getKeyPrice(lock, this.provider)

  const currencyContractAddress = lock.currencyContractAddress || ZERO

  const lockName = lock.name

  // Building a salt from the lock name will prevent creators from creating 2 locks with the same name.
  const salt = ethersUtils
    .sha3(ethersUtils.utf8ToHex(lock.name))
    .substring(0, 26) // 2+24
  const transactionPromise = unlockContract.createLock(
    lock.expirationDuration,
    currencyContractAddress,
    decimalKeyPrice,
    maxNumberOfKeys,
    lockName,
    salt
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
    ({ fragment }) => fragment && fragment.name === 'NewLock'
  )

  if (newLockEvent) {
    return newLockEvent.args.newLockAddress
  }
  // There was no NewEvent log (transaction failed?)
  return null
}
