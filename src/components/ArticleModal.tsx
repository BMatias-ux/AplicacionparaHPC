import React from 'react';
import { NewsArticle } from '../types';
import { X, Clock, Calendar, Share2, Bookmark } from 'lucide-react';

interface ArticleModalProps {
  article: NewsArticle | null;
  onClose: () => void;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({ article, onClose }) => {
  if (!article) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col">
        {/* Header Image with close button */}
        <div className="relative h-56 w-full shrink-0">
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          <button
            onClick={onClose}
            aria-label="Cerrar artículo"
            className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 backdrop-blur-md transition-colors"
          >
            <X size={20} />
          </button>

          <div className="absolute bottom-4 left-4 right-4">
            <span className="bg-[#9C1342] text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              {article.category}
            </span>
            <div className="flex items-center gap-3 text-white/90 text-xs mt-2 font-medium">
              <span className="flex items-center gap-1">
                <Calendar size={13} />
                {article.date}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock size={13} />
                {article.readTime}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <h2 className="text-xl font-bold text-gray-900 leading-snug">
            {article.title}
          </h2>

          <div className="p-3 bg-pink-50/80 border-l-4 border-[#9C1342] rounded-r-lg text-xs text-gray-700 italic">
            {article.summary}
          </div>

          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line space-y-3">
            {article.content}
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-gray-500 text-xs">
            <span>Fundación Habilidades para el Cambio</span>
            <div className="flex gap-2">
              <button 
                onClick={() => alert('Artículo guardado en tus favoritos.')}
                className="p-2 hover:text-[#9C1342] transition-colors"
                title="Guardar"
              >
                <Bookmark size={18} />
              </button>
              <button 
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: article.title,
                      text: article.summary,
                      url: window.location.href,
                    }).catch(() => {});
                  } else {
                    alert('Enlace copiado al portapapeles.');
                  }
                }}
                className="p-2 hover:text-[#9C1342] transition-colors"
                title="Compartir"
              >
                <Share2 size={18} />
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-[#9C1342] text-white font-bold text-sm rounded-xl uppercase tracking-wider hover:bg-[#800f34] transition-colors shadow-md mt-4"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
