import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SearchBox } from "@/components/layout/SearchBox";
import { routes } from "@/lib/routes";

/**
 * A 404 here usually means a part number that is not on the website yet — the catalogue is a fraction of what
 * the warehouse carries. So this page offers a search and a phone call, not an apology.
 */
export default function NotFound() {
  return (
    <Container className="py-16 text-center lg:py-24">
      <p className="text-sm font-medium text-brand-700">404</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        Không tìm thấy trang này
      </h1>
      <p className="mx-auto mt-3 max-w-lg text-body">
        Có thể sản phẩm chưa được đăng lên website. Thử tìm bằng mã sản phẩm, hoặc liên hệ để chúng
        tôi kiểm tra trong kho.
      </p>
      <div className="mx-auto mt-8 max-w-xl">
        <SearchBox size="lg" />
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <ButtonLink href={routes.home}>Về trang chủ</ButtonLink>
        <ButtonLink href={routes.contact} variant="secondary">
          Liên hệ
        </ButtonLink>
      </div>
    </Container>
  );
}
