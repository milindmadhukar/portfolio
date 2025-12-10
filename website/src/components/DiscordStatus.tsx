import { useEffect, useState, useRef } from "react";

interface LanyardData {
  spotify: {
    track_id: string;
    timestamps: {
      start: number;
      end: number;
    };
    song: string;
    artist: string;
    album_art_url: string;
    album: string;
  } | null;
  activities: Array<{
    type: number;
    state: string;
    name: string;
    id: string;
    emoji?: {
      name: string;
      id: string;
      animated: boolean;
    };
    created_at: number;
    application_id: string | null;
    assets?: {
      large_image: string;
      large_text: string;
      small_image: string;
      small_text: string;
    };
  }>;
  listening_to_spotify: boolean;
  discord_user: {
    username: string;
    public_flags: number;
    id: string;
    discriminator: string;
    avatar: string;
  };
  discord_status: string;
}

interface DiscordStatusProps {
  userId: string;
  socketUrl: string;
}

export default function DiscordStatus({ userId, socketUrl }: DiscordStatusProps) {
  const [status, setStatus] = useState<LanyardData | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!userId || !socketUrl) return;

    let isMounted = true;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      if (!isMounted) return;

      const ws = new WebSocket(socketUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        // Connected
      };

      ws.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const message = JSON.parse(event.data);

          switch (message.op) {
            case 1: // Hello
              const { heartbeat_interval } = message.d;
              if (heartbeatIntervalRef.current)
                clearInterval(heartbeatIntervalRef.current);

              heartbeatIntervalRef.current = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({ op: 3 }));
                }
              }, heartbeat_interval);

              // Send Initialize immediately after Hello
              ws.send(
                JSON.stringify({
                  op: 2,
                  d: {
                    subscribe_to_id: userId,
                  },
                })
              );
              break;

            case 0: // Event
              if (message.t === "INIT_STATE" || message.t === "PRESENCE_UPDATE") {
                setStatus(message.d);
                // Dispatch event when data is received for the first time
                window.dispatchEvent(new CustomEvent('lanyard-ready'));
              }
              break;
          }
        } catch (e) {
          console.error("Lanyard parse error:", e);
          // Dispatch ready even on error so we don't block
          window.dispatchEvent(new CustomEvent('lanyard-ready'));
        }
      };

      ws.onclose = () => {
        if (heartbeatIntervalRef.current)
          clearInterval(heartbeatIntervalRef.current);

        if (isMounted) {
          reconnectTimeout = setTimeout(connect, 5000);
        }
      };

      ws.onerror = (error) => {
        ws.close();
        // Dispatch ready on error so we don't block
        window.dispatchEvent(new CustomEvent('lanyard-ready'));
      };
    };

    connect();

    return () => {
      isMounted = false;
      clearTimeout(reconnectTimeout);
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [userId, socketUrl]);

  if (!status) return null;

  const { spotify, activities } = status;

  // Filter out Spotify from activities to avoid duplication if it appears there too
  // Activity type 2 is Listening (often Spotify)
  const otherActivities = activities.filter(
    (activity) => activity.type !== 2 && activity.name !== "Spotify"
  );

  return (
    <div className="flex flex-col gap-[2px]">
      <div>
        <span className="text-ctp-blue">
          <i className="nf nf-md-discord"></i> Status
        </span>
        <span> : </span>
        <span className={
          status.discord_status === 'online' ? 'text-ctp-green' :
            status.discord_status === 'idle' ? 'text-ctp-yellow' :
              status.discord_status === 'dnd' ? 'text-ctp-red' :
                'text-ctp-overlay1'
        }>
          {status.discord_status}
        </span>
      </div>

      {status.listening_to_spotify && spotify && (
        <div>
          <span className="text-ctp-green">
            <i className="nf nf-fa-spotify"></i> Listening to
          </span>
          <span> : </span>
          <a
            href={`https://open.spotify.com/track/${spotify.track_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline hover:text-ctp-green transition-colors"
          >
            {spotify.song}
            <span> by {(() => {
              const artists = spotify.artist;
              const semiColonIndex = artists.indexOf(';');
              if (semiColonIndex !== -1) {
                return artists.slice(0, semiColonIndex);
              }
              return artists;
            })()}</span>
          </a>
        </div>
      )}

      {otherActivities.map((activity, index) => (
        <div key={index}>
          <span className="text-ctp-yellow">
            <i className="nf nf-md-controller_classic"></i> Playing
          </span>
          <span> : {activity.name} {activity.state ? `(${activity.state})` : ''}</span>
        </div>
      ))}
    </div>
  );
}
