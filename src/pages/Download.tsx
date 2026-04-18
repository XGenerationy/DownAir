import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Download, FileAudio, FileVideo, CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Countdown } from '@/components/ui/progress';
import { api } from '@/lib/api';
import type { MediaAnalysisData } from '@/lib/api';

interface FormatOption {
  formatId: string;
  format: string;
  quality: string;
  mimeType: string;
  fileSize?: string;
  isAudioOnly: boolean;
}

export default function DownloadPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [analysisData, setAnalysisData] = useState<MediaAnalysisData | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<FormatOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const state = location.state as { analysis?: MediaAnalysisData } | null;
    if (state?.analysis) {
      setAnalysisData(state.analysis);
    } else {
      navigate('/');
    }
  }, [location.state, navigate]);

  const handleCreate = useCallback(async () => {
    if (!selectedFormat || !analysisData) return;
    const sourceUrl = analysisData.analysis.url;
    if (!sourceUrl) {
      setError('Source URL is missing — please analyze the link again.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.createDownload(
        sourceUrl,
        selectedFormat.formatId,
        selectedFormat.quality,
      );
      if (res.success && res.data) {
        setDownloadUrl(api.getDownloadUrl(res.data.token));
        setCountdown(5);
      } else {
        setError(res.error || 'Download failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setLoading(false);
    }
  }, [selectedFormat, analysisData]);

  const startDownload = useCallback(() => {
    if (!downloadUrl) return;
    setDownloading(true);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.rel = 'noopener noreferrer';
    link.click();
    setTimeout(() => setDownloading(false), 3000);
  }, [downloadUrl]);

  if (!analysisData) return null;

  const { analysis } = analysisData;
  const videoFormats = analysis.formats.filter((f) => !f.isAudioOnly);
  const audioFormats = analysis.formats.filter((f) => f.isAudioOnly);

  return (
    <>
      <Helmet>
        <title>Download - {analysis.title} | DownAir</title>
        <meta name="description" content={`Download ${analysis.title} from ${analysis.platform} in multiple formats.`} />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        <Card className="mb-8 overflow-hidden">
          <div className="flex flex-col sm:flex-row gap-4 p-6">
            {analysis.thumbnail && (
              <div className="shrink-0 w-full sm:w-48 h-32 bg-slate-800 rounded-lg overflow-hidden">
                <img src={analysis.thumbnail} alt={analysis.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white mb-2">{analysis.title}</h1>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="cyan">{analysis.platform}</Badge>
                <Badge variant="outline">{analysis.mediaType}</Badge>
                {analysis.duration && (
                  <Badge variant="outline">
                    {Math.floor(analysis.duration / 60)}:{String(analysis.duration % 60).padStart(2, '0')}
                  </Badge>
                )}
              </div>
              {analysis.author && (
                <p className="text-slate-400 text-sm">by {analysis.author}</p>
              )}
            </div>
          </div>
        </Card>

        {countdown !== null ? (
          <Card className="p-8">
            <div className="flex flex-col items-center py-8">
              {countdown > 0 ? (
                <>
                  <h2 className="text-2xl font-bold text-white mb-6">Preparing Your Download</h2>
                  <Countdown seconds={countdown} onComplete={startDownload} />
                  <p className="text-slate-500 text-xs mt-4">Your download will start automatically</p>
                </>
              ) : downloading ? (
                <div className="text-center">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-2">Download Started!</h2>
                  <p className="text-slate-400">Your file is being downloaded.</p>
                  <Button variant="cyan" className="mt-4" onClick={() => navigate('/')}>
                    Download Another
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-2">Ready!</h2>
                  <Button variant="cyan" onClick={startDownload}>
                    <Download className="w-4 h-4 mr-2" /> Download Now
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <>
            {videoFormats.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FileVideo className="w-5 h-5 text-cyan-400" /> Video Formats
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {videoFormats.map((f) => (
                    <Card
                      key={f.formatId}
                      className={`cursor-pointer transition-all hover:border-cyan-500/50 ${
                        selectedFormat?.formatId === f.formatId ? 'border-cyan-500 bg-cyan-500/5' : ''
                      }`}
                      onClick={() => setSelectedFormat(f)}
                    >
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">{f.quality}</p>
                          <p className="text-slate-400 text-sm">{f.format.toUpperCase()} &bull; {f.mimeType}</p>
                        </div>
                        <div className="text-right">
                          {f.fileSize && <p className="text-slate-400 text-sm">{f.fileSize}</p>}
                          {selectedFormat?.formatId === f.formatId && (
                            <CheckCircle className="w-5 h-5 text-cyan-400 ml-auto" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {audioFormats.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FileAudio className="w-5 h-5 text-cyan-400" /> Audio Formats
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {audioFormats.map((f) => (
                    <Card
                      key={f.formatId}
                      className={`cursor-pointer transition-all hover:border-cyan-500/50 ${
                        selectedFormat?.formatId === f.formatId ? 'border-cyan-500 bg-cyan-500/5' : ''
                      }`}
                      onClick={() => setSelectedFormat(f)}
                    >
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">{f.quality}</p>
                          <p className="text-slate-400 text-sm">{f.format.toUpperCase()} &bull; {f.mimeType}</p>
                        </div>
                        <div className="text-right">
                          {f.fileSize && <p className="text-slate-400 text-sm">{f.fileSize}</p>}
                          {selectedFormat?.formatId === f.formatId && (
                            <CheckCircle className="w-5 h-5 text-cyan-400 ml-auto" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

            <Button
              variant="cyan"
              size="xl"
              className="w-full"
              disabled={!selectedFormat || loading}
              onClick={handleCreate}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Download {selectedFormat ? `(${selectedFormat.quality})` : ''}
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </>
  );
}
