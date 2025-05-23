<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\Product\ProductVariant;
use App\Repository\ProductRepository;
use Doctrine\ORM\EntityManagerInterface;
use Sylius\Bundle\ResourceBundle\Controller\ResourceController;
use Sylius\Component\Resource\ResourceActions;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Sylius\Component\Channel\Context\ChannelContextInterface;
use App\Service\ProductAssociationFilterService;


class ProductController extends ResourceController

{
    function hasTaxonCode($product, string $expectedCode): bool
    {
        foreach ($product->getProductTaxons() as $productTaxon) {
            $taxon = $productTaxon->getTaxon();
            while ($taxon !== null) {
                if ($taxon->getCode() === $expectedCode) {
                    return true;
                }
                $taxon = $taxon->getParent();
            }
        }
        return false;
    }

    public function personalizedShowAction(
        string $slug,
        string $code,
        Request $request,
        ProductRepository $productRepository,
        EntityManagerInterface $em,
        ChannelContextInterface $channelContext
    ): Response {
        $configuration = $this->requestConfigurationFactory->create($this->metadata, $request);
        $this->isGrantedOr403($configuration, ResourceActions::SHOW);
        $locale = $request->getLocale();

        // 🔍 1. Récupérer le produit via le slug
        $product = $productRepository->findBySlug($slug, $locale);

        // 🔍 2. Récupérer n'importe quel variant via son code
        /** @var ProductVariant|null $variant */
        $variant = $em->getRepository(ProductVariant::class)->findOneBy(['code' => $code]);
        if (!$variant) {
            return $this->redirectToRoute('sylius_shop_product_show', [
                'slug' => $slug,
                '_locale' => $request->getLocale(),
            ]);
        }

        $productAssocie = $variant->getProduct();
        $productAssocie->getName();

        if (!$product) {
            throw $this->createNotFoundException('Produit (slug) non trouvé.');
        }

        $channel = $channelContext->getChannel();
        $filterService = $this->get(ProductAssociationFilterService::class);
        $filterService->filterAssociationsByChannel($product, $channel);


        $productsAvecTableaux = $productRepository->findAllWithIsTableauVariant($channel);


        // dd($productsAvecTableaux);

        $taxonsTableaux = [];

        foreach ($productsAvecTableaux as $tableau) {
            foreach ($tableau->getProductTaxons() as $pt) {
                $taxon = $pt->getTaxon();
                if ($taxon && $taxon->getParent() && $taxon->getParent()->getCode() === 'TAB') {
                    $taxonsTableaux[$taxon->getCode()] = [
                        'code' => $taxon->getCode(),
                        'name' => $taxon->getName()
                    ];
                }
            }
        }

        $currentTableauCode = $variant->getCode() ?? null;


        // dd($taxonsTableaux);

        return $this->render('@SyliusShop/Product/Personalized/show.html.twig', [
            'product' => $product,
            'variant' => $variant,
            'productAssocie' => $productAssocie,
            'productsAvecTableaux' => $productsAvecTableaux,
            'resource' => $product,
            'configuration' => $configuration,
            'metadata' => $this->metadata,
            'productSlug' => $slug,
            'isPersoMug' => $this->hasTaxonCode($product, 'PERSO_MUG'),
            'isPersoCadre' => $this->hasTaxonCode($product, 'PERSO_CADRE'),
            'isCarreau' => $product->getProductTaxons()->exists(function ($key, $pt) {
                return $pt->getTaxon() && $pt->getTaxon()->getCode() === 'PERSO_CARREAU';
            }),
            'isPerso' => $this->hasTaxonCode($product, 'PERSO'),
            'tableauxAvecTaxons' => $productsAvecTableaux,
            'taxonsTableaux' => array_values($taxonsTableaux),
            'currentTableauCode' => $currentTableauCode,
        ]);
    }

    public function showAction(Request $request): Response
    {
        $configuration = $this->requestConfigurationFactory->create($this->metadata, $request);
        $this->isGrantedOr403($configuration, ResourceActions::SHOW);

        /** @var \App\Entity\Product\Product $product */
        $product = $this->findOr404($configuration);
        $this->eventDispatcher->dispatch(ResourceActions::SHOW, $configuration, $product);

        $channel = $this->get('sylius.context.channel')->getChannel();
        $filterService = $this->get(ProductAssociationFilterService::class);
        $filterService->filterAssociationsByChannel($product, $channel);

        $isPerso = $this->hasTaxonCode($product, 'PERSO');

        // ✅ Si c’est un produit perso et qu’on n’a pas de code de tableau dans l’URL → REDIRIGER
        if ($isPerso) {
            // Vérifie si le code est déjà présent dans l’URL
            $currentUrl = $request->getRequestUri();
            $slug = $product->getSlug();
            $channel = $this->get('sylius.context.channel')->getChannel();
            // 🔥 Filtrage des associations selon le canal
            $filterService->filterAssociationsByChannel($product, $channel);

            // Redirige uniquement si l'URL ne contient pas déjà TABPERSO_CARREAU
            if (!str_contains($currentUrl, 'TABPERSO_CARREAU')) {
                return $this->redirectToRoute('app_product_personalized', [
                    'slug' => $slug,
                    'code' => 'TABPERSO_CARREAU',
                    '_locale' => $request->getLocale()
                ]);
            }

            // Sinon, comportement normal : afficher sans productAssocie
            $productsAvecTableaux = $this->get('sylius.repository.product')->findAllWithIsTableauVariant();

            return $this->render('@SyliusShop/Product/Personalized/show.html.twig', [
                'product' => $product,
                'productAssocie' => null,
                'productsAvecTableaux' => $productsAvecTableaux,
                'resource' => $product,
                'configuration' => $configuration,
                'metadata' => $this->metadata,
                'isPerso' => $this->hasTaxonCode($product, 'PERSO'),
                'isPersoMug' => $this->hasTaxonCode($product, 'PERSO_MUG'),
                'isPersoCadre' => $this->hasTaxonCode($product, 'PERSO_CADRE'),
                'isCarreau' => $product->getProductTaxons()->exists(function ($key, $pt) {
                    return $pt->getTaxon() && $pt->getTaxon()->getCode() === 'PERSO_CARREAU';
                }),
                'isPerso' => $product->isPerso(),
            ]);
        }

        // Produit classique
        $variantTableau = $product->getVariants()
            ->filter(fn($v) => $v->getIsTableau())
            ->first();

        $isPersoMug = $this->hasTaxonCode($product, 'PERSO_MUG');

        $currentTableauCode = $variantTableau instanceof ProductVariant ? $variantTableau->getCode() : null;

        $imageTextureUrl = null;

        if ($product->getImages()->count() > 0) {
            $image = $product->getImages()->first();
            $imageTextureUrl = '/media/image/' . $image->getPath();
        }

        // dd($imageTextureUrl);

    return $this->render($configuration->getTemplate(ResourceActions::SHOW . '.html'), [
        'configuration' => $configuration,
        'metadata' => $this->metadata,
        'resource' => $product,
        'product' => $product,
        'currentTableauCode' => $currentTableauCode,
        'imageTextureUrl' => $imageTextureUrl,
    ]);
}
}