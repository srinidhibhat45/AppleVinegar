import { customAlphabet } from 'nanoid'

const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz'
const gen = customAlphabet(alphabet, 10)

export const uid = (): string => gen()
