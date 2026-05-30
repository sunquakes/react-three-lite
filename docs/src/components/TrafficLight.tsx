import { useState, useEffect } from 'react'

export default function TrafficLight() {
  const [currentLight, setCurrentLight] = useState('red')

  useEffect(() => {
    // Light color changing animation
    const lightTimer = setInterval(() => {
      setCurrentLight(prev => {
        if (prev === 'red') return 'green'
        if (prev === 'green') return 'yellow'
        return 'red'
      })
    }, 2000)

    return () => clearInterval(lightTimer)
  }, [])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      padding: '8px',
      background: '#333',
      borderRadius: '6px',
      border: '1px solid #666'
    }}>
      <div style={{
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        background: currentLight === 'red' ? '#ff0000' : '#330000',
        boxShadow: currentLight === 'red' ? '0 0 10px #ff0000' : 'none',
        transition: 'all 0.3s'
      }} />
      <div style={{
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        background: currentLight === 'yellow' ? '#ffff00' : '#333300',
        boxShadow: currentLight === 'yellow' ? '0 0 10px #ffff00' : 'none',
        transition: 'all 0.3s'
      }} />
      <div style={{
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        background: currentLight === 'green' ? '#00ff00' : '#003300',
        boxShadow: currentLight === 'green' ? '0 0 10px #00ff00' : 'none',
        transition: 'all 0.3s'
      }} />
    </div>
  )
}