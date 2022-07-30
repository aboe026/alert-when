import { cleanEnv, str } from 'envalid'

export default cleanEnv(process.env, {
  FOO: str({
    desc: 'An environment variable as an example of how to set and use them',
    default: 'bar',
  }),
})
