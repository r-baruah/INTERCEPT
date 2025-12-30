export function Rack() {
    return (
        <div className=\
border
border-zinc-800
rounded
p-4\>
            <h2 className=\text-lg
font-mono
mb-4\>Audio Rack</h2>
            <div className=\space-y-2\>
                <div className=\flex
justify-between\>
                    <span>NASA API</span>
                    <span className=\text-green-500\>CONNECTED</span>
                </div>
                <div className=\flex
justify-between\>
                    <span>Audio Engine</span>
                    <span className=\text-green-500\>READY</span>
                </div>
                <div className=\flex
justify-between\>
                    <span>Tone.js</span>
                    <span className=\text-yellow-500\>BASIC DRONE</span>
                </div>
            </div>
        </div>
    );
}
