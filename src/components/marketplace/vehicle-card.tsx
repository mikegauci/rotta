import Image from "next/image";
import Link from "next/link";
import { FaRegClock } from "react-icons/fa6";
import { formatListedOn, type VehicleCard as Card } from "@/lib/marketplace";
import { mediaUrl } from "@/lib/media";

// A listing card on /marketplace/ ("small" in "Other Vehicles").
export function VehicleCard({
  vehicle,
  small = false,
}: {
  vehicle: Card;
  small?: boolean;
}) {
  return (
    <Link
      href={`/marketplace/${vehicle.slug}/`}
      className="group block transition-transform duration-300 hover:-translate-y-2"
    >
      <span
        className="text-xl leading-[30px] font-bold uppercase"
        style={{ color: vehicle.statusColor || "#00876d" }}
      >
        {vehicle.listingStatus}
      </span>
      <div
        className={`relative my-[18px] bg-[#eee] transition-[filter] duration-300 group-hover:saturate-50 ${
          small ? "h-[250px]" : "h-[200px] md:h-[390px]"
        }`}
      >
        {vehicle.image && (
          <Image
            src={mediaUrl(vehicle.image.path)}
            alt=""
            fill
            sizes={
              small
                ? "(min-width: 768px) 33vw, 100vw"
                : "(min-width: 768px) 40vw, 100vw"
            }
            className="object-cover"
          />
        )}
      </div>
      <div
        className={`flex justify-between gap-4 font-bold text-black ${
          small ? "text-sm" : "text-[17px] md:text-[23px]"
        }`}
      >
        <span>{vehicle.cardTitle}</span>
        <span className="shrink-0">{vehicle.price}</span>
      </div>
      <div className="mt-2 text-black">
        <FaRegClock
          aria-hidden
          className={`mr-2 inline-block align-[-2px] ${small ? "size-3.5" : "size-4"}`}
        />
        <span className={`font-semibold ${small ? "text-sm" : ""}`}>
          {vehicle.year}
        </span>
        <p className="mt-2">{formatListedOn(vehicle.listedOn)}</p>
      </div>
    </Link>
  );
}
