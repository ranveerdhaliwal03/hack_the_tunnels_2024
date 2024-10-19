import { Central as Layout } from "@/layouts";
import "./NotFound.style.scss";

function NotFound() {
  return (
    <Layout title={"Page Not Found"}>
      <h1>404</h1>
      <img src="https://media.tenor.com/qnE69DpVcCoAAAAM/mrfresh-sad-cat.gif"></img>
    </Layout>
  );
}

export default NotFound;
