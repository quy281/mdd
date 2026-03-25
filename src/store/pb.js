import PocketBase from 'pocketbase'

const pb = new PocketBase('https://db.mkg.vn')
pb.autoCancellation(false)

export default pb
