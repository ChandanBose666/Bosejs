import Layout from '../components/Layout.js';
import Home from '../components/Home.js';

export default function IndexPage() {
    return Layout({
        title: 'Bosejs | The All-Powerful Resumable Framework',
        children: Home()
    });
}
