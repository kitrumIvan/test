import { Amplify } from 'aws-amplify'

import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react'
import './App.css'
import '@aws-amplify/ui-react/styles.css'

import awsExports from './aws-exports'
import Home from './Home.jsx'

Amplify.configure(awsExports)

export default function App () {
  const { authStatus } = useAuthenticator(context => [context.authStatus])

  return (
    <div className="App-header">
      {authStatus === 'configuring' && 'Loading...'}
      {authStatus !== 'authenticated' ? <Authenticator/> : <Home/>}
    </div>
  )
}
//https://twnae07t06.execute-api.us-east-1.amazonaws.com/dev