import { Providers } from '@/redux/provider'
import '@/App.css'
import Routes from '@/router'

function App() {

    return (
        <Providers>
            <Routes />
        </Providers>
    )
}

export default App
