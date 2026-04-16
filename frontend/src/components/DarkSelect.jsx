import Select from 'react-select'
import { useTheme } from '../context/ThemeContext'
import { useEffect, useRef } from 'react'

const DarkSelect = (props) => {
  const { modoOscuro } = useTheme()
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return
    const inputs = containerRef.current.querySelectorAll('input')
    inputs.forEach(input => {
      if (modoOscuro) {
        input.style.color = 'white'
        input.style.caretColor = 'white'
      } else {
        input.style.color = ''
        input.style.caretColor = ''
      }
    })
  }, [modoOscuro])

  const darkStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: modoOscuro ? '#374151' : base.backgroundColor,
      borderColor: modoOscuro ? '#4b5563' : base.borderColor,
      minWidth: '200px',
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: modoOscuro ? '#374151' : base.backgroundColor,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: modoOscuro
        ? state.isSelected ? '#3b82f6' : state.isFocused ? '#4b5563' : '#374151'
        : base.backgroundColor,
      color: modoOscuro ? '#f3f4f6' : base.color,
    }),
    singleValue: (base) => ({
      ...base,
      color: modoOscuro ? '#f3f4f6' : base.color,
    }),
    input: (base) => ({
      ...base,
      color: modoOscuro ? 'white' : base.color,
      caretColor: modoOscuro ? 'white' : 'auto',
      opacity: 1,
    }),
    placeholder: (base) => ({
      ...base,
      color: modoOscuro ? '#9ca3af' : base.color,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }),
    indicatorSeparator: (base) => ({
      ...base,
      backgroundColor: modoOscuro ? '#4b5563' : base.backgroundColor,
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: modoOscuro ? '#9ca3af' : base.color,
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: modoOscuro ? '#4b5563' : base.backgroundColor,
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: modoOscuro ? '#f3f4f6' : base.color,
    }),
    valueContainer: (base) => ({
      ...base,
      overflow: 'visible',
    }),
  }

return (
  <div ref={containerRef}>
    <Select 
      {...props} 
      styles={darkStyles} 
      classNamePrefix="react-select"
      onMenuOpen={() => {
        if (!containerRef.current) return
        const inputs = containerRef.current.querySelectorAll('input')
        inputs.forEach(input => {
          input.style.color = modoOscuro ? 'white' : ''
          input.style.caretColor = modoOscuro ? 'white' : ''
        })
      }}
    />
  </div>
)
}

export default DarkSelect