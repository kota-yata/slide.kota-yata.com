document.addEventListener('DOMContentLoaded', function() {
  const galleryContainer = document.getElementById('gallery-container');
  const modal = document.getElementById('pdf-modal');
  const pdfViewer = document.getElementById('pdf-viewer');

  // --- Configuration: Define your slides here ---
  const slidesData = [
    {
      title: "SFCデジタルツインハッカソン:センサー間の物体IDを統合する",
      pdfPath: "pdfs/icar-hackathon.pdf",
      previewImagePath: "previews/icar-hackathon.png",
      slug: "icar-hackathon"
    },
    {
      title: "論文輪読: Implementation and Performance Evaluation of the QUIC Protocol in Linux Kernel",
      pdfPath: "pdfs/quic-in-kernel.pdf",
      previewImagePath: "previews/quic-in-kernel.png",
      slug: "quic-in-kernel"
    },
    {
      title: "RISC-V向けOS上でのICMPプロトコルスタック実装",
      pdfPath: "pdfs/2024f-wip.pdf",
      previewImagePath: "previews/2024f-wip.png",
      slug: "2024f-wip"
    },
    {
      title: "パタヘネ輪読: 第五章",
      pdfPath: "pdfs/ph-5.pdf",
      previewImagePath: "previews/ph-5.png",
      slug: "ph-5"
    },
    {
      title: "パタヘネ輪読: 第一章",
      pdfPath: "pdfs/ph-1.pdf",
      previewImagePath: "previews/ph-1.png",
      slug: "ph-1"
    },
    {
      title: "Media over QUIC Transport: 標準化に向けた貢献",
      pdfPath: "pdfs/2024s-wip.pdf",
      previewImagePath: "previews/2024s-wip.png",
      slug: "2024s-wip"
    },
    {
      title: "MoQTストリーミングフォーマット紹介: LOCとWARP",
      pdfPath: "pdfs/warp-loc.pdf",
      previewImagePath: "previews/warp-loc.png",
      slug: "warp-loc"
    },
    {
      title: "マルチモーダルなセンシングデータを用いたSFC GO AROUND の効果測定",
      pdfPath: "pdfs/2023s-wip.pdf",
      previewImagePath: "previews/2023s-wip.png",
      slug: "2023s-wip"
    },
    {
      title: "BigIntの良いとこ悪いとこ",
      pdfPath: "pdfs/bigint.pdf",
      previewImagePath: "previews/bigint.png",
      slug: "bigint"
    },
    {
      title: "末尾呼び出し最適化とJavaScript",
      pdfPath: "pdfs/js-tco.pdf",
      previewImagePath: "previews/js-tco.png",
      slug: "js-tco"
    },
  ];

  const slidesBySlug = {};
  slidesData.forEach(slide => {
    slidesBySlug[slide.slug] = slide;
  });

  function isMobileView() {
    const mobileBreakpoint = 768; // pixels
    return window.innerWidth <= mobileBreakpoint;
  }

  function updateURL(slug) {
    const newURL = slug ? `#${slug}` : window.location.pathname;
    window.history.pushState({ slug: slug }, '', newURL);
  }

  function getCurrentSlug() {
    return window.location.hash.slice(1); // Remove the # character
  }

  function renderGallery() {
    if (!galleryContainer) {
      console.error("Gallery container not found!");
      return;
    }
    galleryContainer.innerHTML = '';

    slidesData.forEach(slide => {
      const card = document.createElement('div');
      card.className = 'card';
      card.dataset.pdfPath = slide.pdfPath;
      card.dataset.slug = slide.slug;

      const img = document.createElement('img');
      img.src = slide.previewImagePath;
      img.alt = `Preview of ${slide.title}`;
      img.className = 'card-image';

      const titleElement = document.createElement('h3');
      titleElement.className = 'card-title';
      titleElement.textContent = slide.title;

      card.appendChild(img);
      card.appendChild(titleElement);

      card.addEventListener('click', function() {
        const currentSlug = this.dataset.slug;
        const currentPdfPath = this.dataset.pdfPath;
        
        // Update URL with the slide slug
        updateURL(currentSlug);
        
        if (isMobileView()) {
          // On mobile, open the PDF directly (preferably in a new tab)
          window.open(currentPdfPath, '_blank');
        } else {
          // On desktop, open in the modal
          openModal(currentPdfPath);
        }
      });

      galleryContainer.appendChild(card);
    });
  }

  // Function to open the modal (for non-mobile)
  window.openModal = function(pdfSrcPath) {
    if (!modal || !pdfViewer) {
      console.error("Modal or PDF viewer element not found!");
      return;
    }
    pdfViewer.src = pdfSrcPath;
    modal.style.display = "block";
  }

  // Function to close the modal (for non-mobile)
  window.closeModal = function() {
    if (!modal || !pdfViewer) {
      console.error("Modal or PDF viewer element not found!");
      return;
    }
    modal.style.display = "none";
    pdfViewer.src = "";
    updateURL('');
  }

  // Event listener for clicking outside the modal (for non-mobile)
  if (modal) {
    modal.addEventListener('click', function(event) {
      if (event.target === modal) {
        closeModal();
      }
    });
  }

  // Event listener for Escape key (for non-mobile)
  document.addEventListener('keydown', function(event) {
    if (event.key === "Escape" && modal && modal.style.display === "block") {
      closeModal();
    }
  });

  // Handle browser back/forward buttons
  window.addEventListener('popstate', function(event) {
    const slug = event.state ? event.state.slug : getCurrentSlug();
    if (slug && slidesBySlug[slug]) {
      if (isMobileView()) {
        window.open(slidesBySlug[slug].pdfPath, '_blank');
      } else {
        openModal(slidesBySlug[slug].pdfPath);
      }
    } else {
      closeModal();
    }
  });

  function handleInitialHash() {
    const initialSlug = getCurrentSlug();
    if (initialSlug && slidesBySlug[initialSlug]) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        if (isMobileView()) {
          window.open(slidesBySlug[initialSlug].pdfPath, '_blank');
        } else {
          openModal(slidesBySlug[initialSlug].pdfPath);
        }
      }, 100);
    }
  }

  renderGallery();
  handleInitialHash();
});