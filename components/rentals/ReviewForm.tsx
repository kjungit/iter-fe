"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { StarRating } from "@/components/ui/StarRating";
import { Textarea } from "@/components/ui/Textarea";
import { fetchRentalDetail } from "@/lib/api/rentals";
import { useAppData } from "@/lib/store/app-data-context";

export function ReviewForm({ rentalId }: { rentalId: string }) {
  const router = useRouter();
  const { submitReview } = useAppData();
  const { data: rental, isLoading } = useQuery({
    queryKey: ["rental", "detail", rentalId],
    queryFn: () => fetchRentalDetail(rentalId),
  });

  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[520px] px-6 py-16 text-center text-[13px] text-text-secondary">
        불러오는 중...
      </div>
    );
  }

  if (!rental) {
    return (
      <div className="mx-auto max-w-[520px] px-6 py-16 text-center text-[13px] text-text-secondary">
        대여 건을 찾을 수 없습니다.{" "}
        <Link href="/rentals" className="font-semibold text-ink-strong">
          대여내역으로
        </Link>
      </div>
    );
  }

  const handleSubmit = () => {
    submitReview({ rentalId: rental.rentalId, rating, text });
    setRating(5);
    setText("");
    router.push("/rentals");
  };

  return (
    <div className="mx-auto w-full max-w-[520px] px-6 pt-7 pb-24">
      <h1 className="mb-6 text-center text-[20px] font-extrabold text-ink">리뷰 작성</h1>
      <StarRating rating={rating} onChange={setRating} />
      <Textarea
        className="mt-6"
        minHeight={120}
        placeholder="대여 경험을 남겨주세요."
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      <Button variant="primary" size="lg" fullWidth className="mt-6 rounded-md" onClick={handleSubmit}>
        리뷰 등록
      </Button>
    </div>
  );
}
