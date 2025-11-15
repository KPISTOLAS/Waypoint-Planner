import React from 'react'
import { Provider } from 'jotai'
import MainLayout from './components/MainLayout'
import ErrorBoundary from './components/ErrorBoundary'
import './App.css'

function App() {
  console.log('App component rendering...')
  
  return (
    <ErrorBoundary>
      <Provider>
        <MainLayout />
      </Provider>
    </ErrorBoundary>
  )
}

export default App

