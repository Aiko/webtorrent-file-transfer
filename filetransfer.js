const state = VueP('aiko-file-transfer')
// for allowing the possibility of persistence && auth in the future

state.ignoreMany(
    'loading',
    'error',
    'client',
    'torrent',
    'finishedTorrents',
    'addedTorrents'
)

const app = new Vue({
    el: '#app',
    data: {
        // General
        loading: true,
        error: '',
        // WebTorrent
        client: null,
        torrent: null,
        magnet: '',
        finishedTorrents: [],
        addedTorrents: []
    },
    computed: {
        browserSupported() {
            return (!!window.WebTorrent && window.WebTorrent.WEBRTC_SUPPORT && !!window.DragDrop)
        },
        magnetValid() {
            return (!!this.magnet && /magnet:\?xt=urn:[a-z0-9]+:[a-z0-9]{32}/i.test(this.magnet))
        }
    },
    methods: {
        async init() {
            this.client = new WebTorrent()
            await state.save(app)
            this.loading = false
        },
        async maybeSeed() {
            const files = document.getElementById('file').files
            if (files) await this.seed(files)
        },
        async seed(files) {
            this.loading = true
            if (!files || !files.length || files.length == 0) return;
            this.client.seed(files, torrent => {
                app.torrent = torrent
                app.loading = false
            })
        },
        async download() {
            this.loading = true
            if (!this.magnetValid) return (this.error = 'Magnet URI is not valid 😢');
            const metadata = this.client.add(this.magnet, torrent => {
                this.finishedTorrents.push(torrent)
                this.addedTorrents = this.addedTorrents.filter(t => t.magnetURI != torrent.magnetURI)
                this.loading = false
            })
            this.addedTorrents.push(metadata)
        }
    }
})

state.load(app).then(async () => {
    app.loading = true
    if (app.browserSupported) await app.init()
    DragDrop('#dropZ', files => app.seed(files))
}).catch(async e => {
    await state.clear()
    console.error(e)
})