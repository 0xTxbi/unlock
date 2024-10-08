import { useQuery } from '@tanstack/react-query'
import networks from '@unlock-protocol/networks'
import { useWeb3Service } from '~/utils/withWeb3Service'

interface GetLockSymbolProps {
  lockAddress: string
  network: number
  contractAddress?: string | null
}
export const useGetLockCurrencySymbol = ({
  lockAddress,
  network,
  contractAddress,
}: GetLockSymbolProps) => {
  const web3service = useWeb3Service()
  const baseCurrencySymbol = networks?.[network]?.nativeCurrency?.symbol

  return useQuery({
    queryKey: ['getLockSymbol', lockAddress, network, contractAddress],
    queryFn: async () => {
      if (contractAddress) {
        const symbol = await web3service.getTokenSymbol(
          contractAddress,
          network
        )
        return symbol || baseCurrencySymbol
      }

      return baseCurrencySymbol
    },
  })
}
