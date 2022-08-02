import 'dotenv/config' // config is done before anything to ensure proper environment variables loaded

import fetch from 'node-fetch'
import humanizeDuration from 'humanize-duration'
import mailer from 'nodemailer'
import urlJoin from 'url-join'

import env from './env.mjs'
import SMTPTransport from 'nodemailer/lib/smtp-transport.js'

//
;(async () => {
  try {
    console.log(`Jenkins Job: "${env.JENKINS_JOB}"`)
    const buildNumber: string =
      env.JENKINS_BUILD === 'latest' ? await getLatestJobNumber(env.JENKINS_JOB) : env.JENKINS_BUILD
    console.log(`Jenkins Build: "${buildNumber}"`)
    const buildUrl = urlJoin(env.JENKINS_URL, 'job', env.JENKINS_JOB.split('/').join('/job/'), buildNumber)
    const buildApiUrl = urlJoin(buildUrl, 'api/json')
    let inProgress = true
    const start = Date.now()
    while (inProgress) {
      inProgress = await isBuildInProgress(buildApiUrl)
      if (inProgress) {
        console.log(
          `Jenkins build still in progress after "${prettyDuration(Date.now() - start)}", waiting "${
            env.POLL_INTERVAL
          }" seconds...`
        )
        await sleep(env.POLL_INTERVAL)
      }
    }
    const result = await getBuildResult(buildApiUrl)
    console.log(
      `Build completed with result "${result}" after "${prettyDuration(Date.now() - start)}", sending email to "${
        env.EMAIL_TO
      }"`
    )
    await sendEmail(buildUrl, buildNumber, result)
  } catch (err: unknown) {
    console.error(err)
    process.exit(1)
  }
})()

async function sleep(seconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000)
  })
}

async function getLatestJobNumber(jobPath: string): Promise<string> {
  const jobUrl = urlJoin(env.JENKINS_URL, 'job', jobPath.split('/').join('/job/'), 'api/json')
  const response = await fetch(jobUrl, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${env.JENKINS_USERNAME}:${env.JENKINS_TOKEN}`).toString('base64')}`,
    },
  })
  const jobString = await response.text()
  let jobJson
  try {
    jobJson = JSON.parse(jobString)
  } catch (err: unknown) {
    throw Error(`Cannot parse job response "${jobString}" as JSON: "${err}"`)
  }
  return jobJson.lastBuild.number.toString()
}

async function isBuildInProgress(buildUrl: string): Promise<boolean> {
  const response = await fetch(buildUrl, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${env.JENKINS_USERNAME}:${env.JENKINS_TOKEN}`).toString('base64')}`,
    },
  })
  const jobString = await response.text()
  let jobJson
  try {
    jobJson = JSON.parse(jobString)
  } catch (err: unknown) {
    throw Error(`Cannot parse build response "${jobString}" as JSON: "${err}"`)
  }
  return jobJson.inProgress
}

async function getBuildResult(buildUrl: string): Promise<BUILD_RESULT> {
  const response = await fetch(buildUrl, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${env.JENKINS_USERNAME}:${env.JENKINS_TOKEN}`).toString('base64')}`,
    },
  })
  const jobString = await response.text()
  let jobJson
  try {
    jobJson = JSON.parse(jobString)
  } catch (err: unknown) {
    throw Error(`Cannot parse build response "${jobString}" as JSON: "${err}"`)
  }
  return jobJson.result as BUILD_RESULT
}

function prettyDuration(durationMs: number): string {
  const shortEnglishHumanizer = humanizeDuration.humanizer({
    language: 'shortEn',
    languages: {
      shortEn: {
        y: () => 'y',
        mo: () => 'mo',
        w: () => 'w',
        d: () => 'd',
        h: () => 'h',
        m: () => 'm',
        s: () => 's',
        ms: () => 'ms',
      },
    },
  })
  return shortEnglishHumanizer(durationMs, {
    largest: durationMs < 60 ? 1 : 2,
    maxDecimalPoints: 1,
    spacer: '',
    delimiter: '',
  })
}

async function sendEmail(buildUrl: string, buildNumber: string, result: BUILD_RESULT) {
  const options: SMTPTransport.Options = {
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT,
    secure: env.EMAIL_SECURE,
    auth: {
      user: env.EMAIL_USERNAME,
      pass: env.EMAIL_PASSWORD,
    },
  }
  if (env.EMAIL_USERNAME) {
    options.auth = {
      user: env.EMAIL_USERNAME,
      pass: env.EMAIL_PASSWORD,
    }
  }
  if (env.EMAIL_TLS_CIPHERS) {
    options.tls = {
      ciphers: env.EMAIL_TLS_CIPHERS,
    }
  }
  const transporter = mailer.createTransport(options)
  const info = await transporter.sendMail({
    from: env.EMAIL_FROM,
    to: env.EMAIL_TO,
    subject: `Job ${env.JENKINS_JOB} Build ${buildNumber} Completed`,
    text: `The jenkins build ${buildUrl} has completed with result ${result}.`,
  })
  console.log(`Email response: "${info.response}"`)
}

enum BUILD_RESULT {
  ABORTED,
  SUCCESS,
  FAILURE,
  NOT_BUILT,
  UNSTABLE,
}
