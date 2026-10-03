import Image from "next/image";
import Link from "next/link";
import { Calendar, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export type BlogCardData = {
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string;
  category: string;
  author: string;
  publishedAt: Date | string | null;
};

export function BlogCard({ post }: { post: BlogCardData }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <Card className="card-hover overflow-hidden">
        <div className="relative h-48 w-full overflow-hidden">
          <Image
            src={post.featuredImage}
            alt={post.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3">
            <Badge variant="default">{post.category}</Badge>
          </div>
        </div>
        <div className="p-5">
          <h3 className="font-display text-lg font-bold text-primary line-clamp-2">
            {post.title}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" /> {post.author}
            </span>
            {post.publishedAt && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> {formatDate(post.publishedAt)}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
