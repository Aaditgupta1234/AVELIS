import React from "react";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { CollectionsHero } from "../sections/collections/CollectionsHero";
import { CollectionsSearch } from "../sections/collections/CollectionsSearch";
import { CollectionsGrid } from "../sections/collections/CollectionsGrid";
import { EditorsPicks } from "../sections/collections/EditorsPicks";
import { FeaturedAuthor } from "../sections/collections/FeaturedAuthor";
import { ReadingQuote } from "../sections/collections/ReadingQuote";
import { CollectionsCTA } from "../sections/collections/CollectionsCTA";

export const CollectionsPage = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-20">
        <CollectionsHero />
        <CollectionsSearch />
        <CollectionsGrid />
        <EditorsPicks />
        <FeaturedAuthor />
        <ReadingQuote />
        <CollectionsCTA />
      </main>
      
      <Footer />
    </div>
  );
};
