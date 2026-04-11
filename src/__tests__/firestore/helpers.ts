import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import type { Firestore } from 'firebase/firestore'

const TEST_PROJECT_ID = 'demo-test-project'
const EMULATOR_HOST = '127.0.0.1'
const FIRESTORE_PORT = 8080

let testEnv: RulesTestEnvironment | undefined

export async function setupTestEnvironment(): Promise<void> {
  testEnv = await initializeTestEnvironment({
    projectId: TEST_PROJECT_ID,
    firestore: {
      host: EMULATOR_HOST,
      port: FIRESTORE_PORT,
    },
  })
}

export function getTestDb(): Firestore {
  if (!testEnv) throw new Error('Call setupTestEnvironment() in beforeAll first')
  // unauthenticatedContext gives a client Firestore connected to the emulator
  return testEnv.unauthenticatedContext().firestore() as unknown as Firestore
}

export async function clearFirestore(): Promise<void> {
  if (!testEnv) return
  await testEnv.clearFirestore()
}

export async function teardownTestEnvironment(): Promise<void> {
  if (testEnv) {
    await testEnv.cleanup()
    testEnv = undefined
  }
}
