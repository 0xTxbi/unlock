'use client'

import { SettingCard } from '~/components/interface/locks/Settings/elements/SettingCard'
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
  SubmitHandler,
} from 'react-hook-form'

import { Button, ImageUpload, Input, TextBox } from '@unlock-protocol/ui'
import { useImageUpload } from '~/hooks/useImageUpload'
import { EventCollection } from '@unlock-protocol/unlock-js'
import { ToastHelper } from '~/components/helpers/toast.helper'
import { locksmith } from '~/config/locksmith'
import { EditLinkField } from '../LinkField'
import { useEffect, useCallback, useRef } from 'react'

interface GeneralProps {
  eventCollection: EventCollection
}

interface FormValues {
  title: string
  description: string
  coverImage: string
  banner: string
  links: {
    type?: string
    url?: string
  }[]
}
export const General = ({ eventCollection }: GeneralProps) => {
  const methods = useForm<FormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      title: eventCollection.title || '',
      description: eventCollection.description || '',
      coverImage: eventCollection.coverImage || '',
      banner: eventCollection.banner || '',
      links: Array.isArray(eventCollection.links)
        ? eventCollection.links.map((link) => ({
            type: link?.type || '',
            url: link?.url || '',
          }))
        : [],
    },
  })

  const {
    fields: linkFields,
    append,
    remove,
  } = useFieldArray({
    control: methods.control,
    name: 'links',
  })

  const { mutateAsync: uploadImage, isPending: isUploading } = useImageUpload()
  const links = methods.watch('links')

  const isSubmittingRef = useRef(false)

  const save: SubmitHandler<FormValues> = useCallback(
    async (values) => {
      if (isSubmittingRef.current) return
      isSubmittingRef.current = true
      try {
        await locksmith.updateEventCollection(eventCollection.slug!, {
          title: values.title,
          description: values.description,
          coverImage: values.coverImage,
          banner: values.banner,
          links: values.links,
          managerAddresses: eventCollection.managerAddresses!,
        })
        ToastHelper.success('Event Collection info saved successfully!')
      } catch (error) {
        ToastHelper.error('Failed to save event collection details.')
      } finally {
        isSubmittingRef.current = false
      }
    },
    [eventCollection.slug, eventCollection.managerAddresses]
  )

  // Debounce save to prevent multiple rapid submissions
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const subscription = methods.watch((_, { name, type }) => {
      if (name?.startsWith('links') && type === 'change') {
        if (debounceTimeout.current) {
          clearTimeout(debounceTimeout.current)
        }
        debounceTimeout.current = setTimeout(() => {
          methods.handleSubmit(save)()
        }, 500)
      }
    })
    return () => {
      subscription.unsubscribe()
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current)
      }
    }
  }, [methods, save])

  return (
    <FormProvider {...methods}>
      <form
        className="grid grid-cols-1 gap-6"
        onSubmit={methods.handleSubmit(save)}
      >
        {/* Basic information settings */}
        <SettingCard
          label="Title, description, and cover image"
          description="Change the title, description, and cover image for your event collection!"
        >
          <div className="flex gap-4 flex-col md:flex-row">
            <div className="order-2 md:order-1">
              <Controller
                name="coverImage"
                control={methods.control}
                rules={{ required: 'Cover image is required' }}
                render={({
                  field: { onChange, value },
                  fieldState: { error },
                }) => (
                  <ImageUpload
                    description="This image will be used for the event collection. Use 512 by 512 pixels for best results."
                    isUploading={isUploading}
                    preview={value}
                    onChange={async (fileOrFileUrl: any) => {
                      if (typeof fileOrFileUrl === 'string') {
                        onChange(fileOrFileUrl)
                      } else {
                        const items = await uploadImage(fileOrFileUrl[0])
                        const image = items?.[0]?.publicUrl
                        if (!image) return
                        onChange(image)
                      }
                    }}
                    error={error?.message}
                  />
                )}
              />
            </div>
            <div className="flex flex-col order-1 gap-4 md:order-2 grow">
              <Input
                {...methods.register('title', {
                  required: {
                    value: true,
                    message: 'Title is required',
                  },
                })}
                type="text"
                placeholder="Name"
                label="Event collection title"
                description={
                  'Enter the name of your event. It will appear on the NFT tickets.'
                }
                error={methods.formState.errors.title?.message}
              />

              <TextBox
                {...methods.register('description', {
                  required: {
                    value: true,
                    message: 'Please add a description for your event',
                  },
                })}
                label="Description"
                placeholder="Write description here."
                description={
                  <p>
                    Enter a description for your event.{' '}
                    <a
                      className="text-brand-ui-primary hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                      href="https://www.markdownguide.org/cheat-sheet"
                    >
                      Markdown is supported.
                    </a>
                  </p>
                }
                rows={5}
                error={methods.formState.errors.description?.message}
              />
            </div>
          </div>
          <div className="flex flex-end w-full pt-8 flex-row-reverse">
            <Button
              loading={methods.formState.isSubmitting}
              type="submit"
              className="w-48"
            >
              Save
            </Button>
          </div>
        </SettingCard>

        {/* Banner settings */}
        <SettingCard
          label="Banner"
          description="Update the banner of your event collection."
        >
          <Controller
            name="banner"
            control={methods.control}
            rules={{ required: 'Banner is required' }}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <ImageUpload
                description="This banner will be used as the banner for your event collection. The recommended aspect ratio is 1400x300."
                isUploading={isUploading}
                size="full"
                imageRatio="cover"
                preview={value || eventCollection.banner!}
                onChange={async (fileOrFileUrl: any) => {
                  if (typeof fileOrFileUrl === 'string') {
                    onChange(fileOrFileUrl)
                  } else {
                    const items = await uploadImage(fileOrFileUrl[0])
                    const image = items?.[0]?.publicUrl
                    if (!image) return
                    onChange(image)
                  }
                }}
                error={error?.message}
              />
            )}
          />
          <div className="flex flex-col sm:flex-row-reverse w-full pt-8">
            <Button
              loading={methods.formState.isSubmitting}
              type="submit"
              className="w-full sm:w-48"
            >
              Save
            </Button>
          </div>
        </SettingCard>

        {/* Links settings */}
        <SettingCard
          label="Links"
          description="Update the links of your event collection."
        >
          {linkFields.map((field, index) => (
            <EditLinkField key={field.id} index={index} remove={remove} />
          ))}
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => append({ type: 'website', url: '' })}
              disabled={
                linkFields.length > 0
                  ? !links[linkFields.length - 1]?.type ||
                    !links[linkFields.length - 1]?.url
                  : false
              }
            >
              Add Link
            </Button>
          </div>
          {methods.formState.errors.links &&
            typeof methods.formState.errors.links.message === 'string' && (
              <p className="text-red-500 text-sm">
                {methods.formState.errors.links.message}
              </p>
            )}
        </SettingCard>
      </form>
    </FormProvider>
  )
}