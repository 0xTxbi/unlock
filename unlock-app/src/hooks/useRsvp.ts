import { useMutation, useQuery } from '@tanstack/react-query'
import { SubgraphService } from '@unlock-protocol/unlock-js'
import dayjs from 'dayjs'
import { locksmith } from '~/config/locksmith'

interface RsvpOption {
  data?: any
  email?: string
  captcha: string
  recipient?: string
}

interface UseEventRSVPProps {
  lockAddress: string
  network: number
  eventEndDate: string
}

interface Options {
  lockAddress: string
  network: number
}

interface KeysQuery {
  where: {
    lock: string
    expiration_gt?: number
  }
}

export const useRsvp = ({ lockAddress, network }: Options) => {
  return useMutation({
    mutationKey: ['rsvp', network, lockAddress],
    mutationFn: async ({ data, recipient, captcha, email }: RsvpOption) => {
      try {
        const response = await locksmith.rsvp(network, lockAddress, captcha, {
          recipient,
          data,
          email,
        })
        return response.data
      } catch (error: any) {
        if (error.response?.data?.message) {
          return error.response.data
        }
        throw error
      }
    },
    retry: 2,
  })
}

// fetch the number of RSVPs for an event
export const useEventRSVP = ({
  lockAddress,
  network,
  eventEndDate,
}: UseEventRSVPProps) => {
  return useQuery({
    queryKey: ['eventRSVP', lockAddress, network, eventEndDate],
    queryFn: async () => {
      const service = new SubgraphService()
      const currentTime = Math.floor(Date.now() / 1000)
      const isEventExpired = dayjs(eventEndDate).isBefore(dayjs())

      const keysQuery: KeysQuery = {
        where: {
          lock: lockAddress.toLowerCase(),
        },
      }

      // If the event is not expired, only count non-expired keys
      if (!isEventExpired) {
        keysQuery.where.expiration_gt = currentTime
      }

      const keys = await service.keys(keysQuery, { networks: [network] })

      return {
        rsvpCount: keys.length,
        isExpired: isEventExpired,
      }
    },
  })
}
