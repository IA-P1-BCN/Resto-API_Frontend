import { screen, within } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'

export async function answerConfirm(user: UserEvent, button: string) {
  const dialog = await screen.findByRole('alertdialog')
  await user.click(within(dialog).getByRole('button', { name: button }))
}
