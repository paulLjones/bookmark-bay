import { Route, Router } from "@solidjs/router";
import Layout from "./layout/Layout";
import Grouped, { GroupedData } from "./pages/Grouped";
import ResolveDupes, { ResolveDupesData } from "./pages/ResolveDupes";
import Search, { SearchData } from "./pages/Search";
import Tags, { TagsData } from "./pages/Tags";

export default function App() {
    return (
        <Router root={Layout}>
            <Route path="/grouped" component={Grouped} preload={GroupedData} />
            <Route path="/search" component={Search} preload={SearchData} />
            <Route
                path="/resolve-dupes"
                component={ResolveDupes}
                preload={ResolveDupesData}
            />
            <Route path="/tags" component={Tags} preload={TagsData} />
        </Router>
    );
}
