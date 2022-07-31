import { bool, cleanEnv, num, str } from 'envalid'

export default cleanEnv(process.env, {
  JENKINS_URL: str({
    desc: 'The URL of the Jenkins server to interact with.',
  }),
  JENKINS_USERNAME: str({
    desc: 'The username to authenticate against Jenkins with.',
  }),
  JENKINS_TOKEN: str({
    desc: 'The api token to authenticate against Jenkins with.',
  }),
  JENKINS_JOB: str({
    desc: 'The full path to the Jenkins job.',
  }),
  JENKINS_BUILD: str({
    desc: 'The build number of the Jenkins job to alert after finishes',
    default: 'latest',
  }),
  POLL_INTERVAL: num({
    desc: 'Number of seconds to reach out to Jenkins for build progress',
    default: 10,
  }),
  EMAIL_HOST: str({
    desc: 'The hostname of the email server to use for sending emails.',
    example: 'smtp-mail.outlook.com',
  }),
  EMAIL_PORT: num({
    desc: 'The port of the email server to use for sending emails.',
    default: 587,
  }),
  EMAIL_SECURE: bool({
    desc: 'Whether or not the email server uses secure SMTP',
    default: false,
  }),
  EMAIL_USERNAME: str({
    desc: 'The username to authenticate against the email server.',
  }),
  EMAIL_PASSWORD: str({
    desc: 'The username to authenticate against the email server.',
  }),
  EMAIL_FROM: str({
    desc: 'The email address that email should be sent from.',
    example: '"Jenkins CI" <jenkins@ci.com>',
  }),
  EMAIL_TO: str({
    desc: 'A comma-separated list of email recipients to send emails to.',
    example: 'john-doe@gmail.com,jane-doe@outlook.com',
  }),
  EMAIL_TLS_CIPHERS: str({
    desc: 'A comma-separates list of TLS ciphers to use when communicating with the email server',
    default: '',
  }),
})
