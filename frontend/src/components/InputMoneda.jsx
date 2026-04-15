import { useState, useEffect } from 'react'

const formatearValor = (valor) => {
  if (!valor && valor !== 0) return ''
  const numero = valor.toString().replace(/\D/g, '')
  if (!numero) return ''
  return '$' + parseInt(numero).toLocaleString('es-CO')
}

const desformatearValor = (valor) => {
  if (!valor) return ''
  return valor.toString().replace(/\D/g, '')
}

const InputMoneda = ({ value, onChange, placeholder = '$0', className = '', required = false, disabled = false, readOnly = false }) => {
  const [displayValue, setDisplayValue] = useState(formatearValor(value))

  useEffect(() => {
    setDisplayValue(formatearValor(value))
  }, [value])

  const handleChange = (e) => {
    const raw = desformatearValor(e.target.value)
    setDisplayValue(raw ? '$' + parseInt(raw).toLocaleString('es-CO') : '')
    onChange(raw)
  }

  const handleBlur = () => {
    setDisplayValue(formatearValor(desformatearValor(displayValue)))
  }

  return (
    <input
      type="text"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
    />
  )
}

export default InputMoneda