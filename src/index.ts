import 'dotenv/config' // config is done before anything to ensure proper environment variables loaded

import env from './env'
;(async () => {
  try {
    console.log('Hello World!')
    console.log(`FOO: '${env.FOO}'`)
  } catch (err: unknown) {
    console.error(err)
    process.exit(1)
  }
})()
