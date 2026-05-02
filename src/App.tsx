import { Providers } from '@/redux/provider'
import '@/App.css'
import Routes from '@/router'
import { ThemeProvider } from '@/common/ThemeProvider'
import E2EEInitializer from '@/common/E2EEInitializer'

function App() {

    return (
        <ThemeProvider>
            <Providers>
                <E2EEInitializer />
                <Routes />
            </Providers>
        </ThemeProvider>
    )
}

export default App
