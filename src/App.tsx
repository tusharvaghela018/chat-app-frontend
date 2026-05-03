import { Providers } from '@/redux/provider'
import '@/App.css'
import Routes from '@/router'
import { ThemeProvider } from '@/common/ThemeProvider'

function App() {

    return (
        <ThemeProvider>
            <Providers>
                <Routes />
            </Providers>
        </ThemeProvider>
    )
}

export default App
