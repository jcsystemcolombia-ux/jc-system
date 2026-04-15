import Select from 'react-select'
import { useTheme } from '../context/ThemeContext'

const DarkSelect = (props) => {
  const { modoOscuro } = useTheme()

  const darkStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: modoOscuro ? '#374151' : base.backgroundColor,
      borderColor: modoOscuro ? '#4b5563' : base.borderColor,
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
      color: modoOscuro ? '#f3f4f6' : base.color,
      caretColor: modoOscuro ? '#f3f4f6' : base.caretColor,
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

    control: (base) => ({
  ...base,
  backgroundColor: modoOscuro ? '#374151' : base.backgroundColor,
  borderColor: modoOscuro ? '#4b5563' : base.borderColor,
  minWidth: '200px',
}),
    valueContainer: (base) => ({
    ...base,
    overflow: 'visible',
    }),
  }

  return <Select {...props} styles={darkStyles} classNamePrefix="react-select" />
}

export default DarkSelect