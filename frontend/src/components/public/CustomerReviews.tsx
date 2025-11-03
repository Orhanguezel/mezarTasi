import { useState } from "react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { Star } from "lucide-react";

export function CustomerReviews() {
  const [reviewData, setReviewData] = useState({
    name: "",
    email: "",
    rating: 5,
    comment: ""
  });

  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleRatingClick = (rating: number) => {
    setReviewData(prev => ({ ...prev, rating }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Yorum gönderildi:", reviewData);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setShowForm(false);
      setReviewData({ name: "", email: "", rating: 5, comment: "" });
    }, 3000);
  };

  if (submitted) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <div className="bg-white p-12 rounded-lg">
            <div className="text-teal-600 text-6xl mb-6">✓</div>
            <h2 className="text-2xl mb-4 text-teal-600">Teşekkür Ederiz!</h2>
            <p className="text-gray-600">
              Görüşünüz başarıyla alındı. Değerli yorumunuz için teşekkür ederiz.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (showForm) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-white p-8 rounded-lg">
            <h2 className="text-2xl text-center mb-8 text-teal-600">
              Yorumunuzu Paylaşın
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Input
                  type="text"
                  value={reviewData.name}
                  onChange={(e) => setReviewData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Adınız Soyadınız"
                  required
                  className="w-full h-12"
                />
              </div>

              <div>
                <Input
                  type="email"
                  value={reviewData.email}
                  onChange={(e) => setReviewData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="E-posta Adresiniz"
                  required
                  className="w-full h-12"
                />
              </div>

              <div>
                <div className="flex justify-center space-x-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRatingClick(star)}
                      className={`text-3xl transition-colors ${star <= reviewData.rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                    >
                      <Star className="w-8 h-8 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Textarea
                  value={reviewData.comment}
                  onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Hizmetlerimiz hakkındaki görüşlerinizi paylaşın..."
                  rows={6}
                  required
                  className="w-full"
                />
              </div>

              <div className="flex space-x-4">
                <Button
                  type="submit"
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white h-12"
                >
                  Gönder
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="flex-1 h-12"
                >
                  İptal
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 max-w-2xl text-center">
        <h2 className="text-3xl mb-12 text-teal-600">
          GÖRÜŞLERİNİZ BİZİM İÇİN DEĞERLİDİR
        </h2>

        <div className="bg-white p-8 rounded-lg mb-8">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGNpdHklMjBiaWtlfGVufDF8fHx8MTc1NjA3MTEzNnww&ixlib=rb-4.1.0&q=80&w=400&h=300&fit=crop&crop=center"
            alt="Müşteri Görüşleri"
            className="w-full max-w-md mx-auto rounded-lg mb-6"
          />

          <div className="bg-teal-600 text-white p-4 rounded-lg mb-6 inline-flex items-center space-x-3">
            <div className="bg-white text-teal-600 px-3 py-1 rounded">
              <span className="font-semibold">mezarisim.com</span>
            </div>
            <span>Yaptığımız hizmetleri değerlendirmek için</span>
          </div>

          <p className="text-gray-600 mb-8 leading-relaxed">
            Memnuniyetiniz bizim önceliğimizdir. Hizmetlerimiz hakkındaki görüş ve
            önerilerinizi bizimle paylaşın. Sizin değerli yorumlarınız, hizmet kalitemizi
            artırmamıza yardımcı oluyor.
          </p>

          <Button
            onClick={() => setShowForm(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 h-12"
          >
            Yorum Gönder
          </Button>
        </div>
      </div>
    </section>
  );
}